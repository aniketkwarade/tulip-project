"""Pipeline definition for the bounded EIA adoption pilot."""

from kedro.pipeline import Pipeline, node, pipeline

from .nodes import (
    build_adoption_evaluation,
    summarize_grid_snapshot,
    validate_contract_snapshot,
)


def create_pipeline(**_: object) -> Pipeline:
    """Create a visible source → validation → summary → artifact pipeline."""
    return pipeline(
        [
            node(
                func=validate_contract_snapshot,
                inputs=[
                    "eia_grid_snapshot",
                    "params:eia_required_fields",
                    "params:adoption_gate",
                ],
                outputs="eia_validation_report",
                name="validate_contract_bound_eia_snapshot",
                tags=["validation", "eia", "pilot"],
            ),
            node(
                func=summarize_grid_snapshot,
                inputs=["eia_grid_snapshot", "eia_validation_report"],
                outputs="eia_grid_summary",
                name="summarize_bounded_eia_panel",
                tags=["transformation", "eia", "pilot"],
            ),
            node(
                func=build_adoption_evaluation,
                inputs=[
                    "eia_grid_snapshot",
                    "eia_validation_report",
                    "eia_grid_summary",
                ],
                outputs="eia_kedro_pilot_result",
                name="materialize_kedro_adoption_evaluation",
                tags=["output", "lineage", "pilot"],
            ),
        ]
    )
