const SMS_API_URL = "https://api.ubill.dev/v1/sms/send";

type UbillResponse = {
  statusID: number;
  message?: string;
};

export async function sendSms(
  phoneDigits: string,
  text: string,
): Promise<void> {
  const response = await fetch(SMS_API_URL, {
    method: "POST",
    headers: {
      key: process.env.SMS_PROVIDER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      brandID: Number(process.env.SMS_BRAND_ID ?? 1),
      numbers: [Number(`995${phoneDigits}`)],
      text,
      stopList: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`SMS პროვაიდერმა უპასუხა სტატუსით ${response.status}`);
  }

  const result = (await response.json()) as UbillResponse;
  if (result.statusID !== 0) {
    throw new Error(result.message ?? "SMS-ის გაგზავნა ვერ მოხერხდა");
  }
}
