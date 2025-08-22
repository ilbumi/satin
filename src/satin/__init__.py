import uvicorn


def main() -> None:
    uvicorn.run(
        "satin.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
