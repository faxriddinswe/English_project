import pytest
from pydantic import ValidationError

from app.core.schemas import RegisterIn, Login, PasswordChange
from app.modules.auth.service import hasher, verify_password


@pytest.mark.parametrize("password", ["1", "abc", "🔐", "  a  ", "   ", "p" * 1024])
def test_arbitrary_nonempty_password_round_trips_without_trimming(password):
    account = RegisterIn(full_name="NAMUNA Student", phone="+998901234567", password=password)
    change = PasswordChange(current_password=password, new_password=password)
    login = Login(username="sample-student", password=password)
    assert (
        account.password
        == change.new_password
        == change.current_password
        == login.password
        == password
    )
    assert verify_password(hasher.hash(account.password), login.password)


def test_empty_password_is_still_required():
    for model, values in [
        (RegisterIn, {"full_name": "NAMUNA Student", "phone": "+998901234567", "password": ""}),
        (PasswordChange, {"current_password": "existing", "new_password": ""}),
        (Login, {"username": "sample-student", "password": ""}),
    ]:
        with pytest.raises(ValidationError):
            model(**values)
