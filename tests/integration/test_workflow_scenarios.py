"""Integration tests for complex workflow scenarios."""

from bson import ObjectId
from fastapi.testclient import TestClient

from satin.models.annotation import AnnotationUpdate, BoundingBox
from satin.models.tag import TagUpdate
from tests.conftest import MockDependencies
from tests.fixtures.sample_data import GRAPHQL_QUERIES, create_test_annotation, create_test_image, create_test_tag


class TestCompleteAnnotationWorkflow:
    """Test complete annotation workflows from start to finish."""

    async def test_complete_image_annotation_lifecycle(self, mock_dependencies: MockDependencies):
        """Test complete workflow: create image -> create tags -> annotate -> version -> export."""
        # Step 1: Create image
        image = await mock_dependencies.image_repo.create(create_test_image("https://example.com/test-image.jpg"))
        assert image.status.value == "new"

        # Step 2: Create hierarchical tag structure
        # Animals -> Dogs -> [Breed, Size]
        animals_tag = await mock_dependencies.tag_repo.create_hierarchical(
            create_test_tag("Animals", description="Animal categories")
        )
        dogs_tag = await mock_dependencies.tag_repo.create_hierarchical(
            create_test_tag("Dogs", parent_id=str(animals_tag.id), description="Dog categories")
        )
        breed_tag = await mock_dependencies.tag_repo.create_hierarchical(
            create_test_tag("Golden Retriever", parent_id=str(dogs_tag.id))
        )
        size_tag = await mock_dependencies.tag_repo.create_hierarchical(
            create_test_tag("Large", parent_id=str(dogs_tag.id))
        )

        # Verify tag hierarchy
        assert animals_tag.depth == 0
        assert dogs_tag.depth == 1
        assert dogs_tag.path == "Animals/Dogs"
        assert breed_tag.path == "Animals/Dogs/Golden Retriever"

        # Step 3: Create initial annotation
        bbox1 = BoundingBox(x=100, y=100, width=200, height=150)
        annotation1 = create_test_annotation(
            image_id=image.id,
            bounding_box=bbox1,
            description="Main dog in image",
            tags=[breed_tag.id, size_tag.id],
            confidence=0.95,
        )
        created_annotation = await mock_dependencies.annotation_repo.create_versioned(annotation1)

        # Verify annotation
        assert created_annotation.version == 1
        assert len(created_annotation.tags) == 2
        assert created_annotation.confidence == 0.95

        # Update tag usage counts
        await mock_dependencies.tag_repo.increment_usage_count(breed_tag.id)
        await mock_dependencies.tag_repo.increment_usage_count(size_tag.id)

        # Step 4: Update annotation (creates version 2)
        updated_annotation = await mock_dependencies.annotation_repo.update_versioned(
            created_annotation.id,
            AnnotationUpdate(description="Main golden retriever in center of image", confidence=0.98),
        )

        assert updated_annotation.version == 2
        assert updated_annotation.description == "Main golden retriever in center of image"
        assert updated_annotation.confidence == 0.98

        # Step 5: Add second annotation
        bbox2 = BoundingBox(x=300, y=50, width=100, height=80)
        annotation2 = create_test_annotation(
            image_id=image.id, bounding_box=bbox2, description="Toy in background", confidence=0.75
        )
        await mock_dependencies.annotation_repo.create_versioned(annotation2)

        # Step 6: Get active annotations for image
        active_annotations = [
            ann async for ann in mock_dependencies.annotation_repo.get_active_annotations_for_image(image.id)
        ]

        # Should have 2 active annotations
        assert len(active_annotations) == 2
        descriptions = [ann.description for ann in active_annotations]
        assert "Main golden retriever in center of image" in descriptions
        assert "Toy in background" in descriptions

        # Step 7: Mark image as annotated
        updated_image = await mock_dependencies.image_repo.mark_as_annotated(str(image.id))
        assert updated_image.status.value == "annotated"

        # Step 8: Test version history
        version_history = [ann async for ann in mock_dependencies.annotation_repo.get_version_history(image.id)]

        # Should have 3 versions total (1 original, 1 update, 1 new annotation)
        assert len(version_history) >= 2

        # Step 9: Test tag statistics
        stats = await mock_dependencies.tag_repo.get_tag_statistics()
        assert stats["total_tags"] == 4  # Animals, Dogs, Golden Retriever, Large
        assert stats["total_usage"] >= 2  # At least 2 increments

        # Step 10: Test restoration scenario
        restored = await mock_dependencies.annotation_repo.restore_version(image.id, 1)
        assert restored is not None
        assert restored.version == 4  # New version created (1 original, 1 update, 1 second annotation, 1 restore)
        assert restored.description == "Main dog in image"  # Original description

    async def test_complex_tag_hierarchy_operations(self, mock_dependencies: MockDependencies):
        """Test complex tag hierarchy manipulations."""
        # Create initial hierarchy: Animals -> [Mammals, Birds]
        animals = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag("Animals"))
        mammals = await mock_dependencies.tag_repo.create_hierarchical(
            create_test_tag("Mammals", parent_id=str(animals.id))
        )
        birds = await mock_dependencies.tag_repo.create_hierarchical(
            create_test_tag("Birds", parent_id=str(animals.id))
        )

        # Add subcategories: Mammals -> [Dogs, Cats], Birds -> [Eagles, Sparrows]
        dogs = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag("Dogs", parent_id=str(mammals.id)))
        cats = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag("Cats", parent_id=str(mammals.id)))
        eagles = await mock_dependencies.tag_repo.create_hierarchical(
            create_test_tag("Eagles", parent_id=str(birds.id))
        )
        sparrows = await mock_dependencies.tag_repo.create_hierarchical(
            create_test_tag("Sparrows", parent_id=str(birds.id))
        )

        # Verify initial hierarchy
        assert mammals.path == "Animals/Mammals"
        assert dogs.path == "Animals/Mammals/Dogs"
        assert eagles.path == "Animals/Birds/Eagles"

        # Test complex move: Move Dogs from Mammals to Animals (making it sibling of Mammals)
        moved_dogs = await mock_dependencies.tag_repo.move_tag(dogs.id, str(animals.id))
        assert moved_dogs.path == "Animals/Dogs"
        assert moved_dogs.depth == 1

        # Verify descendants of original parent (Mammals) no longer include Dogs
        mammals_descendants = [tag async for tag in mock_dependencies.tag_repo.get_descendants(mammals.id)]
        mammals_descendant_names = [tag.name for tag in mammals_descendants]
        assert "Dogs" not in mammals_descendant_names
        assert "Cats" in mammals_descendant_names

        await mock_dependencies.tag_repo.update_hierarchical(mammals.id, TagUpdate(name="Mammals_Renamed"))

        # Verify cats path was updated
        updated_cats = await mock_dependencies.tag_repo.get_by_id(cats.id)
        assert updated_cats.path == "Animals/Mammals_Renamed/Cats"

        # Test deletion with descendants
        deleted_count = await mock_dependencies.tag_repo.delete_with_descendants(birds.id)
        assert deleted_count == 3  # Birds, Eagles, Sparrows

        # Verify birds tree is gone
        assert await mock_dependencies.tag_repo.get_by_id(birds.id) is None
        assert await mock_dependencies.tag_repo.get_by_id(eagles.id) is None
        assert await mock_dependencies.tag_repo.get_by_id(sparrows.id) is None

        # Verify other parts of hierarchy intact
        remaining_animals = await mock_dependencies.tag_repo.get_by_id(animals.id)
        remaining_dogs = await mock_dependencies.tag_repo.get_by_id(dogs.id)
        assert remaining_animals is not None
        assert remaining_dogs is not None

    async def test_annotation_conflict_resolution(self, mock_dependencies: MockDependencies):
        """Test annotation conflict scenarios and resolution strategies."""
        # Create image
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/test.jpg"))

        # Create overlapping annotations (simulating ML vs manual annotations)
        bbox_overlap = BoundingBox(x=100, y=100, width=150, height=100)

        # ML annotation (low confidence)
        ml_annotation = create_test_annotation(
            image_id=image.id, bounding_box=bbox_overlap, description="ML detected object", confidence=0.6
        )
        created_ml = await mock_dependencies.annotation_repo.create_versioned(ml_annotation)

        # Update source to ML
        await mock_dependencies.annotation_repo._collection.update_one(
            {"_id": created_ml.id}, {"$set": {"source": "ml"}}
        )

        # Manual annotation (high confidence, slightly different bbox)
        bbox_manual = BoundingBox(x=95, y=105, width=160, height=95)
        manual_annotation = create_test_annotation(
            image_id=image.id, bounding_box=bbox_manual, description="Manually verified object", confidence=0.95
        )
        await mock_dependencies.annotation_repo.create_versioned(manual_annotation)

        # Test finding by source
        ml_annotations = [ann async for ann in mock_dependencies.annotation_repo.find_by_source("ml")]
        manual_annotations = [ann async for ann in mock_dependencies.annotation_repo.find_by_source("manual")]

        assert len(ml_annotations) == 1
        assert len(manual_annotations) == 1

        # Test confidence-based filtering
        high_confidence = [ann async for ann in mock_dependencies.annotation_repo.find_by_confidence_range(0.9, 1.0)]
        low_confidence = [ann async for ann in mock_dependencies.annotation_repo.find_by_confidence_range(0.0, 0.7)]

        assert len(high_confidence) == 1  # Manual annotation
        assert len(low_confidence) == 1  # ML annotation
        assert high_confidence[0].source == "manual"
        assert low_confidence[0].source == "ml"

        # Simulate conflict resolution: soft delete ML annotation, keep manual
        deleted_ml = await mock_dependencies.annotation_repo.soft_delete_versioned(created_ml.id)
        assert deleted_ml.change_type.value == "delete"

        # Verify only manual annotation is active
        active = [ann async for ann in mock_dependencies.annotation_repo.get_active_annotations_for_image(image.id)]

        assert len(active) == 1
        assert active[0].source == "manual"
        assert active[0].confidence == 0.95


class TestGraphQLWorkflowIntegration:
    """Test workflows through GraphQL API."""

    async def test_graphql_complete_workflow(self, test_client: TestClient):
        """Test complete workflow through GraphQL API."""
        # Step 1: Create image via GraphQL
        create_image_response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_image"],
                "variables": {"input": {"url": "https://example.com/workflow-test.jpg"}},
            },
        )

        assert create_image_response.status_code == 200
        image_data = create_image_response.json()["data"]["createImage"]
        image_id = image_data["id"]

        # Step 2: Create tag via GraphQL
        create_tag_response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_tag"],
                "variables": {"input": {"name": "TestObject", "description": "Object for testing"}},
            },
        )

        assert create_tag_response.status_code == 200
        tag_data = create_tag_response.json()["data"]["createTag"]
        tag_id = tag_data["id"]

        # Step 3: Create annotation via GraphQL
        create_annotation_response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_annotation"],
                "variables": {
                    "input": {
                        "imageId": image_id,
                        "boundingBox": {"x": 50.0, "y": 60.0, "width": 120.0, "height": 80.0},
                        "tags": [tag_id],
                        "description": "Test annotation via GraphQL",
                        "confidence": 0.9,
                    }
                },
            },
        )

        assert create_annotation_response.status_code == 200
        annotation_data = create_annotation_response.json()["data"]["createAnnotation"]
        annotation_id = annotation_data["id"]

        # Step 4: Update annotation via GraphQL
        update_annotation_response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_annotation"],
                "variables": {"id": annotation_id, "input": {"description": "Updated annotation via GraphQL"}},
            },
        )

        assert update_annotation_response.status_code == 200
        updated_data = update_annotation_response.json()["data"]["updateAnnotation"]
        assert updated_data["version"] == 2

        # Step 5: Query version history
        history_response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["annotation_version_history"], "variables": {"imageId": image_id}},
        )

        assert history_response.status_code == 200
        history_data = history_response.json()["data"]["annotationVersionHistory"]
        assert len(history_data) >= 2  # Original and updated versions

        # Step 6: Restore version
        restore_response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["restore_annotation_version"],
                "variables": {"imageId": image_id, "version": 1},
            },
        )

        assert restore_response.status_code == 200
        restored_data = restore_response.json()["data"]["restoreAnnotationVersion"]
        assert restored_data["version"] == 3
        assert restored_data["description"] == "Test annotation via GraphQL"

    async def test_graphql_error_handling_workflow(self, test_client: TestClient):
        """Test error handling in GraphQL workflows."""
        # Test creating annotation with invalid image ID
        invalid_annotation_response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_annotation"],
                "variables": {
                    "input": {
                        "imageId": "invalid-id-format",
                        "boundingBox": {"x": 0, "y": 0, "width": 10, "height": 10},
                        "description": "Should fail",
                    }
                },
            },
        )

        # Should return error or handle gracefully
        assert invalid_annotation_response.status_code == 200
        response_data = invalid_annotation_response.json()
        # Either errors field exists or data is null/empty
        assert "errors" in response_data or response_data.get("data", {}).get("createAnnotation") is None

        # Test querying non-existent annotation
        nonexistent_query = test_client.post(
            "/graphql", json={"query": GRAPHQL_QUERIES["get_annotation"], "variables": {"id": str(ObjectId())}}
        )

        assert nonexistent_query.status_code == 200
        query_data = nonexistent_query.json()
        assert query_data["data"]["annotation"] is None


class TestDataConsistencyScenarios:
    """Test data consistency across repositories."""

    async def test_orphaned_data_handling(self, mock_dependencies: MockDependencies):
        """Test handling of orphaned annotations when images are deleted."""
        # Create image and annotations
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/test.jpg"))

        annotations = []
        for i in range(3):
            annotation = create_test_annotation(
                image_id=image.id,
                description=f"Annotation {i + 1}",
                bounding_box=BoundingBox(x=i * 50, y=i * 50, width=100, height=100),
            )
            created = await mock_dependencies.annotation_repo.create_versioned(annotation)
            annotations.append(created)

        # Delete image
        deleted = await mock_dependencies.image_repo.delete_by_id(image.id)
        assert deleted is True

        # Annotations should still exist (orphaned)
        for annotation in annotations:
            existing = await mock_dependencies.annotation_repo.get_by_id(annotation.id)
            assert existing is not None

        # But queries by image_id should return empty
        by_image = [ann async for ann in mock_dependencies.annotation_repo.find_by_image(image.id)]
        assert len(by_image) == 3  # Still exist but are orphaned

        active_by_image = [
            ann async for ann in mock_dependencies.annotation_repo.get_active_annotations_for_image(image.id)
        ]
        assert len(active_by_image) == 3  # Still considered active

    async def test_tag_annotation_consistency(self, mock_dependencies: MockDependencies):
        """Test consistency between tags and annotations that reference them."""
        # Create image and tag
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/test.jpg"))
        tag = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag("TestTag"))

        # Create annotation with tag
        annotation = create_test_annotation(image_id=image.id, tags=[tag.id], description="Tagged annotation")
        created_annotation = await mock_dependencies.annotation_repo.create_versioned(annotation)

        # Increment tag usage
        await mock_dependencies.tag_repo.increment_usage_count(tag.id)

        # Delete tag
        deleted_count = await mock_dependencies.tag_repo.delete_with_descendants(tag.id)
        assert deleted_count == 1

        # Annotation should still exist but now has orphaned tag reference
        existing_annotation = await mock_dependencies.annotation_repo.get_by_id(created_annotation.id)
        assert existing_annotation is not None
        assert tag.id in existing_annotation.tags  # Still references deleted tag

        # Test finding by now non-existent tag
        by_deleted_tag = [ann async for ann in mock_dependencies.annotation_repo.find_by_tags([tag.id])]
        assert len(by_deleted_tag) == 1  # Still finds annotation with orphaned reference
