-- Publica as questões de exemplo após validação da alternativa correta.
-- Em produção, novas questões devem passar pelo fluxo editorial (approve_content → publish_content).
update public.questions
set status = 'PUBLISHED',
    published_by = coalesce(reviewed_by, created_by),
    updated_at = now()
where status in ('DRAFT', 'REVIEW', 'APPROVED')
  and exists (
    select 1 from public.question_options o
    where o.question_id = public.questions.id and o.is_correct
  );
