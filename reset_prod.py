import os, asyncio, bcrypt, asyncpg

async def main():
    tenant_id = "qa-prod-ownership"
    user_id = "8b8f31eb-a88f-4541-af1e-6aa0a593769a"
    email = "qa-prod-dealer-a@qa.nadakki.com"
    dsn = os.environ["DATABASE_URL"]
    assert "xqqdyrntuohxxpfpznga" in dsn, "no es produccion"
    hashed = bcrypt.hashpw(os.environ["QA_PROD_DEALER_A_PASSWORD"].encode(), bcrypt.gensalt()).decode()
    conn = await asyncpg.connect(dsn, statement_cache_size=0)
    try:
        async with conn.transaction():
            await conn.execute("select set_config('app.current_tenant_id', $1, true)", tenant_id)
            row = await conn.fetchrow(
                "update users set password_hash = $1, is_active = true "
                "where id = $2::uuid and lower(email) = lower($3) and role = 'dealer' "
                "returning id::text", hashed, user_id, email)
            if not row:
                raise SystemExit("RESET_FAILED")
        print("RESET_OK")
    finally:
        await conn.close()

asyncio.run(main())
