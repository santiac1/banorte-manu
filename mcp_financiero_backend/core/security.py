from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

from .config import SUPABASE_SERVICE_KEY, SUPABASE_URL

bearer_scheme = HTTPBearer()

supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


async def get_current_user_id(
    token: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    try:
        user_response = supabase_admin.auth.get_user(token.credentials)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no válido")

        metadata = user.user_metadata or {}
        app_user_id = metadata.get("app_user_id")

        if app_user_id is None:
            raise HTTPException(
                status_code=403,
                detail=(
                    "El token no contiene el identificador app_user_id requerido "
                    "para interactuar con la base de datos principal."
                ),
            )

        return str(app_user_id)
    except Exception as exc:  # pragma: no cover - supabase client handles details
        raise HTTPException(status_code=401, detail=f"Token inválido: {exc}")
