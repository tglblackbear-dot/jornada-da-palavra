-- Dados de exemplo para comunidade, ciclos e eventos.
insert into public.groups (name, description) values
 ('Igreja Local','Grupo geral da congregação'),
 ('Juventude','Encontros e estudos para jovens'),
 ('Pequenos Grupos','Comunhão em casa')
on conflict (name) do nothing;

insert into public.cycles (id, title, description, start_at, end_at, status) values
 ('ccccccc1-0000-4000-8000-000000000001','Ciclo Fundamentos','Quatro semanas de fundamentos da fé', now() - interval '1 day', now() + interval '27 days', 'ACTIVE')
on conflict (id) do nothing;

insert into public.events (id, title, description, starts_at, location, status) values
 ('eeeeeee1-0000-4000-8000-000000000001','Encontro de Estudo Bíblico','Um encontro para estudar juntos', now() + interval '7 days', 'Salão principal', 'OPEN')
on conflict (id) do nothing;
