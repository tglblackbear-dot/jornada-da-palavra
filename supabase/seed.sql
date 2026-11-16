-- Seed inicial. TODO o conteúdo bíblico fica em DRAFT até revisão humana.
-- Nenhuma pergunta é publicada automaticamente.

insert into public.categories (name, description) values
 ('Fundamentos da Fé','Crenças essenciais da fé cristã'),
 ('Vida Cristã','Discipulado e cotidiano'),
 ('Evangelhos','Vida e ensinos de Jesus'),
 ('Antigo Testamento','História, lei e profetas'),
 ('Novo Testamento','Igreja, cartas e Apocalipse'),
 ('Oração','Comunicação com Deus'),
 ('Família','Relacionamentos e lar'),
 ('Discipulado','Formação de discípulos')
on conflict (name) do nothing;

insert into public.study_tracks (id,title,description,status) values
 ('11111111-1111-4111-8111-111111111111','Fundamentos da Fé','Primeiros passos na fé cristã','DRAFT'),
 ('22222222-2222-4222-8222-222222222222','Vida Cristã','O discipulado no dia a dia','DRAFT'),
 ('33333333-3333-4333-8333-333333333333','Evangelhos','Estudo dos evangelhos','DRAFT')
on conflict (id) do nothing;

insert into public.achievements (code,title,description,criteria) values
 ('first_study','Primeiro Estudo','Concluiu o primeiro estudo','{"studies":1}'),
 ('first_week','Primeira Semana','Sete dias de constância','{"streak":7}'),
 ('ten_studies','Dez Estudos','Concluiu dez estudos','{"studies":10}'),
 ('fifty_studies','Cinquenta Estudos','Concluiu cinquenta estudos','{"studies":50}'),
 ('hundred_studies','Cem Estudos','Concluiu cem estudos','{"studies":100}'),
 ('first_track','Primeira Trilha','Concluiu uma trilha','{"tracks":1}'),
 ('first_book','Primeiro Livro Concluído','Estudou um livro completo','{"books":1}'),
 ('thirty_days','Trinta Dias de Constância','Trinta dias consecutivos','{"streak":30}')
on conflict (code) do nothing;

insert into public.questions (id,statement,reference,book,difficulty,category_id,explanation,translation,status)
values
 ('aaaaaaa1-0000-4000-8000-000000000001','Em qual evangelho se encontra o Sermão do Monte?','Mateus 5–7','Mateus','facil',(select id from public.categories where name='Evangelhos'),'Questão de localização bíblica. Consulte a referência na sua tradução.','Referência bíblica','DRAFT'),
 ('aaaaaaa1-0000-4000-8000-000000000002','Quem escreveu a maior parte das cartas do Novo Testamento?','Romanos 1:1','Romanos','facil',(select id from public.categories where name='Novo Testamento'),'Questão de localização bíblica. Consulte a referência na sua tradução.','Referência bíblica','DRAFT'),
 ('aaaaaaa1-0000-4000-8000-000000000003','Qual é o primeiro livro da Bíblia?','Gênesis 1:1','Gênesis','facil',(select id from public.categories where name='Antigo Testamento'),'Questão de localização bíblica. Consulte a referência na sua tradução.','Referência bíblica','DRAFT'),
 ('aaaaaaa1-0000-4000-8000-000000000004','No contexto bíblico, o que significa "discípulo"?','João 13:35','João','medio',(select id from public.categories where name='Discipulado'),'Questão conceitual. A explicação definitiva deve ser escrita e revisada por um teólogo autorizado.','Referência bíblica','DRAFT'),
 ('aaaaaaa1-0000-4000-8000-000000000005','Qual livro registra os Dez Mandamentos?','Êxodo 20','Êxodo','facil',(select id from public.categories where name='Antigo Testamento'),'Questão de localização bíblica. Consulte a referência na sua tradução.','Referência bíblica','DRAFT'),
 ('aaaaaaa1-0000-4000-8000-000000000006','Como Jesus ensinou seus discípulos a orar?','Lucas 11:1-4','Lucas','medio',(select id from public.categories where name='Oração'),'Questão conceitual. A explicação definitiva deve ser escrita e revisada por um teólogo autorizado.','Referência bíblica','DRAFT')
on conflict (id) do nothing;

insert into public.question_options (question_id,option_text,is_correct,position) values
 ('aaaaaaa1-0000-4000-8000-000000000001','Mateus',true,1),
 ('aaaaaaa1-0000-4000-8000-000000000001','Marcos',false,2),
 ('aaaaaaa1-0000-4000-8000-000000000001','Lucas',false,3),
 ('aaaaaaa1-0000-4000-8000-000000000001','João',false,4),
 ('aaaaaaa1-0000-4000-8000-000000000002','Paulo',true,1),
 ('aaaaaaa1-0000-4000-8000-000000000002','Pedro',false,2),
 ('aaaaaaa1-0000-4000-8000-000000000002','Tiago',false,3),
 ('aaaaaaa1-0000-4000-8000-000000000003','Gênesis',true,1),
 ('aaaaaaa1-0000-4000-8000-000000000003','Êxodo',false,2),
 ('aaaaaaa1-0000-4000-8000-000000000003','Salmos',false,3),
 ('aaaaaaa1-0000-4000-8000-000000000004','Aquele que segue a Jesus e aprende com ele',true,1),
 ('aaaaaaa1-0000-4000-8000-000000000004','Aquele que apenas conhece a história',false,2),
 ('aaaaaaa1-0000-4000-8000-000000000005','Êxodo',true,1),
 ('aaaaaaa1-0000-4000-8000-000000000005','Deuteronômio',false,2),
 ('aaaaaaa1-0000-4000-8000-000000000006','Com uma oração ensinada por Jesus',true,1),
 ('aaaaaaa1-0000-4000-8000-000000000006','Com repetições mecânicas',false,2)
on conflict do nothing;

insert into public.study_track_items (track_id,question_id,position) values
 ('11111111-1111-4111-8111-111111111111','aaaaaaa1-0000-4000-8000-000000000001',1),
 ('11111111-1111-4111-8111-111111111111','aaaaaaa1-0000-4000-8000-000000000002',2),
 ('22222222-2222-4222-8222-222222222222','aaaaaaa1-0000-4000-8000-000000000004',1),
 ('33333333-3333-4333-8333-333333333333','aaaaaaa1-0000-4000-8000-000000000006',1)
on conflict do nothing;

insert into public.app_settings (key,value) values
 ('points', '{"correct_answer":10,"study_completed":20,"track_completed":100,"review_completed":10}'),
 ('review_intervals','{"errou":1,"errou_novamente":2,"acertou":7,"bom_dominio":14,"dominio_consolidado":30}'),
 ('streak_milestones','[3,5,7,14,30]')
on conflict (key) do nothing;
