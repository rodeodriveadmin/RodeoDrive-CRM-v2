// Strings owned by the sms cluster.

export const smsEn = {
  "sms.title": "SMS",
  "sms.compose": "Compose",
  "sms.message": "Message",
  "sms.recipients": "Recipients (one number per line)",
  "sms.fromLeads": "Fill from campaign leads",
  "sms.send": "Send",
  "sms.history": "Send history",
  "sms.recipientsCount": "Recipients",
  "sms.status.SIMULATED": "Simulated",
  "sms.status.SENT": "Sent",
  "sms.status.FAILED": "Failed",
  "sms.simulatedNote":
    "No SMS provider is configured yet — batches are recorded as SIMULATED. Connect Twilio/Unifonic/Msegat at deployment to send for real.",
  "sms.none": "No batches sent yet",
  "sms.sentBy": "Sent by",
} as const;

export const smsAr: Record<keyof typeof smsEn, string> = {
  "sms.title": "الرسائل النصية",
  "sms.compose": "إنشاء رسالة",
  "sms.message": "الرسالة",
  "sms.recipients": "المستلمون (رقم في كل سطر)",
  "sms.fromLeads": "تعبئة من عملاء الحملات",
  "sms.send": "إرسال",
  "sms.history": "سجل الإرسال",
  "sms.recipientsCount": "المستلمون",
  "sms.status.SIMULATED": "محاكاة",
  "sms.status.SENT": "مرسلة",
  "sms.status.FAILED": "فاشلة",
  "sms.simulatedNote":
    "لم يتم ربط مزود رسائل بعد — تُسجل الدفعات كمحاكاة. اربط Twilio/Unifonic/Msegat عند النشر للإرسال الفعلي.",
  "sms.none": "لا توجد دفعات مرسلة بعد",
  "sms.sentBy": "أرسلها",
};
