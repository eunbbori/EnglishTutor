/**
 * 토스페이먼츠 결제 API 유틸리티
 * 문서: https://docs.tosspayments.com/reference
 */

const TOSS_API_URL = "https://api.tosspayments.com/v1";
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "";

// 인코딩된 시크릿 키 (Basic Auth)
function getAuthHeader(): string {
  const encodedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
  return `Basic ${encodedKey}`;
}

export interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface PaymentConfirmResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  // ... 기타 필드
}

/**
 * 결제 승인 요청
 */
export async function confirmPayment(
  data: PaymentConfirmRequest
): Promise<PaymentConfirmResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "결제 승인 실패");
  }

  return response.json();
}

/**
 * 결제 조회
 */
export async function getPayment(paymentKey: string): Promise<PaymentConfirmResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "결제 조회 실패");
  }

  return response.json();
}

/**
 * 결제 취소
 */
export async function cancelPayment(
  paymentKey: string,
  reason: string
): Promise<PaymentConfirmResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cancelReason: reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "결제 취소 실패");
  }

  return response.json();
}

// 정기 결제(빌링) 관련 상수
export const SUBSCRIPTION_AMOUNT = 6900; // ₩6,900/월
export const SUBSCRIPTION_ORDER_NAME = "Politely Premium 월 구독";
