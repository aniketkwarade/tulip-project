"""Register the bounded EIA lineage pilot pipeline."""

from kedro.pipeline import Pipeline

from tulip_kedro_pilot.pipelines.eia_lineage import create_pipeline


def register_pipelines() -> dict[str, Pipeline]:
    """Return the default and explicitly named pilot pipelines."""
    pipeline = create_pipeline()
    return {
        "__default__": pipeline,
        "eia_lineage": pipeline,
    }
