/**
 * `process.env` e o unico global de runtime que o shared toca.
 *
 * Declarado aqui em vez de puxar @types/node: o pacote e consumido tambem pelo
 * React Native, onde nao existe Node — o que existe e a injecao de variaveis
 * feita pelo Metro, que emula justamente este objeto.
 */
declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;
