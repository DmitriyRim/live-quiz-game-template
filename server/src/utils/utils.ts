export function getAnswerString(data: unknown): string {
  const answer = {
    data,
    type: "reg",
    id: 0
  }

  return JSON.stringify(answer);
}