interface RpcError {
  message: string
  code?: string
}

interface RpcResult {
  data: unknown
  error: RpcError | null
}

type ClienteRpc = {
  rpc: (
    funcion: string,
    argumentos?: Record<string, unknown>
  ) => Promise<RpcResult>
}

/**
 * Llama funciones incluidas en una migración que todavía no puede reflejarse
 * en `types/database.ts`: ese archivo solo se regenera después de aplicar la
 * migración a la base compartida. La salida sigue entrando como `unknown` y se
 * valida en cada límite.
 */
export function rpcMigrado(
  cliente: unknown,
  funcion: string,
  argumentos?: Record<string, unknown>
) {
  return (cliente as ClienteRpc).rpc(funcion, argumentos)
}
