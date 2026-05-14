type AxiosLike = { response?: { data?: { message?: string } } };

export function getApiErrorMessage(err: unknown): string | undefined {
  if (err instanceof Error && 'response' in err) {
    return (err as AxiosLike).response?.data?.message;
  }
  return undefined;
}
