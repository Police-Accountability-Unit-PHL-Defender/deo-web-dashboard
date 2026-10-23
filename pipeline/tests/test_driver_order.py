import pandas as pd

from update_db_models import order_like_reference


def test_renumbered_ids_preserve_reference_person_order():
    reference = pd.DataFrame([
        {"cartodb_id": 10, "objectid": 100, "location": "A", "race": "Black", "age": 30},
        {"cartodb_id": 11, "objectid": 101, "location": "A", "race": "White", "age": 40},
    ])
    current = pd.DataFrame([
        {"cartodb_id": 1, "objectid": 1, "location": "A", "race": "White", "age": 40, "gdb_geomattr_data": ""},
        {"cartodb_id": 2, "objectid": 2, "location": "B", "race": "Asian", "age": 50, "gdb_geomattr_data": ""},
        {"cartodb_id": 3, "objectid": 3, "location": "A", "race": "Black", "age": 30, "gdb_geomattr_data": ""},
        {"cartodb_id": 4, "objectid": 4, "location": "C", "race": "Black", "age": 20, "gdb_geomattr_data": ""},
    ])
    result = order_like_reference(current, reference)
    assert result.cartodb_id.tolist() == [3, 1, 2, 4]
    assert result.groupby("location", sort=False).first().loc["A", "race"] == "Black"
    assert result.index.tolist() == [0, 1, 2, 3]


def test_identical_people_remain_present():
    reference = pd.DataFrame({"cartodb_id": [10, 11], "race": ["Black", "Black"]})
    current = pd.DataFrame({"cartodb_id": [2, 1], "race": ["Black", "Black"]})
    result = order_like_reference(current, reference)
    assert result.cartodb_id.tolist() == [2, 1]
