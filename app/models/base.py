#file: app/models/base.py
#created: 2025-08-06
#description: Base model for Pydantic with camelCase alias generation to match OpenAPI specifications.
from pydantic import BaseModel, ConfigDict

def to_camel(string: str) -> str:
    parts = string.split('_')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])

class CamelCaseBaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,  # ORM mode
    )
