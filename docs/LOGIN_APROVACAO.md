# Login com aprovação — Base Lotufo

Branch de desenvolvimento: `feature/login-aprovacao-supabase`.

## Progresso
- [x] Criada migração SQL de perfis e aprovação.
- [ ] Executar migração no Supabase (SQL Editor).
- [ ] Configurar conta administrativa inicial.
- [ ] Criar interface de cadastro, login, espera e painel de aprovação.
- [ ] Restringir **todas** as tabelas de tutoriais, links e arquivos no Supabase por RLS e regras de Storage.
- [ ] Testar acesso anônimo, pendente, aprovado e bloqueado antes de publicar.

**Atenção:** esconder elementos no HTML não protege dados. O site atual é um HTML estático e já utiliza Supabase; dados existentes podem continuar públicos até que suas políticas RLS e regras de armazenamento sejam auditadas e atualizadas.

A migração está em `supabase/migrations/20261030_access_approval.sql`. A promoção do primeiro administrador deve ser feita no SQL Editor usando o e-mail real do proprietário. Não coloque chaves secretas no navegador.

Não mescle esta branch com `main` até concluir os itens pendentes.
