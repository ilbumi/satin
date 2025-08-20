# Minimal makefile for Sphinx documentation
#

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD  ?= sphinx-build
SOURCEDIR    = source
BUILDDIR     = build

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile

# Generate API documentation from source code
apidoc:
	sphinx-apidoc -o $(SOURCEDIR)/api ../src/satin --force --module-first

# Serve documentation locally for development
serve: html
	@echo "Serving documentation at http://localhost:8080"
	@python -m http.server 8080 -d $(BUILDDIR)/html

# Clean and rebuild everything
clean-build: clean html
	@echo "Documentation rebuilt successfully"

# Install documentation dependencies
install-deps:
	pip install sphinx sphinx-rtd-theme sphinx-autodoc-typehints myst-parser

# Check for broken links
linkcheck:
	@$(SPHINXBUILD) -b linkcheck "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

# Build documentation in different formats
pdf: latex
	@$(MAKE) -C $(BUILDDIR)/latex all-pdf
	@echo "PDF documentation built in $(BUILDDIR)/latex/"

epub:
	@$(SPHINXBUILD) -M epub "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
	@echo "EPUB documentation built in $(BUILDDIR)/epub/"

# Watch for changes and rebuild automatically (requires sphinx-autobuild)
watch:
	sphinx-autobuild "$(SOURCEDIR)" "$(BUILDDIR)/html" --open-browser

# Build documentation with warnings as errors (for CI)
strict:
	@$(SPHINXBUILD) -b html -W "$(SOURCEDIR)" "$(BUILDDIR)/html" $(SPHINXOPTS) $(O)

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
