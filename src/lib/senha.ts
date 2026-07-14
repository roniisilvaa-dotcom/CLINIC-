/**
 * Utilitário de hash de senha (usa só o módulo "crypto" nativo do Node — sem
  * dependência externa nova, pra não precisar mexer em package.json).
   *
    * Formato armazenado: "salt:hash" (ambos em hex).
     *
      * Antes, a senha da Dra. era salva e comparada em TEXTO PURO no banco (campo
       * senhaHash guardava a senha real, sem hash nenhum) — se o banco vazasse, a
        * senha de login ficaria exposta. Agora toda senha nova é hasheada com scrypt
         * (salt aleatório por usuário + comparação em tempo constante), e senhas antigas
          * em texto puro continuam funcionando no login (comparação direta) mas são
           * automaticamente re-hasheadas no primeiro login bem-sucedido — migração
            * transparente, sem precisar resetar a senha de ninguém.
             */
             import crypto from "crypto";

             export function hashSenha(senha: string): string {
                 const salt = crypto.randomBytes(16).toString("hex");
                     const hash = crypto.scryptSync(senha, salt, 64).toString("hex");
                         return `${salt}:${hash}`;
                         }

                         export function senhaEstaEmTextoPuro(armazenada: string): boolean {
                             return !!armazenada && !armazenada.includes(":");
                             }

                             export function verificarSenha(senha: string, armazenada: string): boolean {
                                 if (!armazenada) return false;

                                   if (senhaEstaEmTextoPuro(armazenada)) {
                                             return armazenada === senha;
                                                 }

                                                   const [salt, hash] = armazenada.split(":");
                                                       try {
                                                                 const tentativa = crypto.scryptSync(senha, salt, 64);
                                                                           const original = Buffer.from(hash, "hex");
                                                                                     if (original.length !== tentativa.length) return false;
                                                                                               return crypto.timingSafeEqual(original, tentativa);
                                                                                                   } catch {
                                                                                                             return false;
                                                                                                                 }
                                                                                                                 }
                                                                                                                 
