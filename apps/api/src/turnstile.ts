export type VerifyTurnstile = (input: {
  token: string;
  secret: string;
  remoteIp: string | null;
}) => Promise<boolean>;

type SiteverifyResult = { success: boolean };

const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const verifyTurnstileWithCloudflare: VerifyTurnstile = async ({
  token,
  secret,
  remoteIp,
}) => {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteIp) form.append("remoteip", remoteIp);
  const response = await fetch(siteverifyUrl, { method: "POST", body: form });
  const { success } = await response.json<SiteverifyResult>();

  return success;
};
