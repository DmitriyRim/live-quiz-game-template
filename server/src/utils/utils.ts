export function getAnswerString(type: string, data: unknown): string {
  const answer = {
    data,
    type,
    id: 0
  }

  return JSON.stringify(answer);
}

export function randomPassword(len: number): string{
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = '';

    for(let i = 0; i < len; i++){
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    return password;
}