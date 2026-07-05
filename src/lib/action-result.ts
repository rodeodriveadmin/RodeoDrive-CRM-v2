// Uniform result shape for every server action, so client code can always
// check `res.error` without type narrowing gymnastics.
export type ActionResult = {
  ok?: boolean;
  error?: string;
  id?: string;
};
