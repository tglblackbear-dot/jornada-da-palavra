-- Palavra do Dia: reflexões originais + referência bíblica.
-- Não reproduzimos texto de traduções bíblicas protegidas por direitos autorais.
-- Cada entrada aponta a referência para o leitor consultar na sua tradução.

insert into public.daily_word (day, reference, reflection, context, status) values
 ('2026-11-16','Salmos 23:1',
  'O salmo começa com uma afirmação de confiança: o Senhor é o meu pastor. Antes de pedir qualquer coisa, o salmista reconhece quem cuida dele. Comece hoje reconhecendo o que Deus já é, não apenas o que você precisa.',
  'Salmos 23 — um canto de confiança em meio à caminhada.','PUBLISHED'),
 ('2026-11-17','Provérbios 3:5-6',
  'Confiar de todo o coração é mais do que concordar com uma ideia: é entregar a direção. A promessa bíblica aqui é de que Deus endireita os caminhos de quem confia Nele, mesmo quando a rota não é a que esperávamos.',
  'Provérbios 3 — sabedoria para o cotidiano.','PUBLISHED'),
 ('2026-11-18','Mateus 6:9-13',
  'Jesus ensinou seus discípulos a orar começando pela identidade de Deus e pelo Seu reinado, antes de apresentar necessidades pessoais. Essa ordem nos ajuda a orar com confiança e com o coração alinhado ao que importa.',
  'Mateus 6 — o ensino de Jesus sobre a oração.','PUBLISHED'),
 ('2026-11-19','João 13:34-35',
  'O mandamento de Jesus vai além da simpatia: ele chama seus seguidores a um amor que se reconhece pela prática. Pequenos gestos concretos de cuidado tornam-se testemunho quando feitos em Seu nome.',
  'João 13 — o novo mandamento no contexto da última ceia.','PUBLISHED'),
 ('2026-11-20','Filipenses 4:6-7',
  'A recomendação não é fingir que não há ansiedade, mas levá-la a Deus em oração, com gratidão. A paz que a carta descreve não depende de circunstâncias tranquilas: ela guarda o coração.',
  'Filipenses 4 — alegria e paz mesmo nas dificuldades.','PUBLISHED'),
 ('2026-11-21','Lucas 15:20',
  'Na parábola, o pai vê o filho ainda de longe e corre ao seu encontro. O texto revela muito sobre o caráter de Deus: Ele não espera uma performance, Ele recebe quem volta.',
  'Lucas 15 — parábolas da misericórdia.','PUBLISHED'),
 ('2026-11-22','Romanos 8:28',
  'A promessa não diz que tudo é bom, mas que Deus atua em todas as coisas para o bem daqueles que O amam. É uma confiança que se apoia no caráter de Deus, não na ausência de problemas.',
  'Romanos 8 — vida no Espírito.','PUBLISHED')
on conflict (day) do nothing;
