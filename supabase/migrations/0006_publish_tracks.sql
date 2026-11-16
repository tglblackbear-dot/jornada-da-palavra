-- Trilhas de exemplo disponíveis para todos os usuários autenticados.
update public.study_tracks set status = 'PUBLISHED' where status in ('DRAFT', 'APPROVED', 'REVIEW');
