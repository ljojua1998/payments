type ApiResult = { error: string | null; code?: string };

async function postJson(url: string, payload: unknown): Promise<ApiResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return { error: null };
    }
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      code?: string;
    } | null;
    return {
      error: body?.error ?? "მოთხოვნა ვერ შესრულდა — სცადეთ თავიდან",
      code: body?.code,
    };
  } catch {
    return { error: "კავშირი ვერ დამყარდა — შეამოწმეთ ინტერნეტი" };
  }
}

export function startRegistration(phone: string): Promise<ApiResult> {
  return postJson("/api/auth/register/start", { phone });
}

export function verifyRegistration(input: {
  phone: string;
  code: string;
  fullName: string;
  password: string;
}): Promise<ApiResult> {
  return postJson("/api/auth/register/verify", input);
}

export function startPasswordReset(phone: string): Promise<ApiResult> {
  return postJson("/api/auth/reset/start", { phone });
}

export function verifyPasswordReset(input: {
  phone: string;
  code: string;
  password: string;
}): Promise<ApiResult> {
  return postJson("/api/auth/reset/verify", input);
}
