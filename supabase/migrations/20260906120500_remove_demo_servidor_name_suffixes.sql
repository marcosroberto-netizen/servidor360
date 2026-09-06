update servidores.servidores
set nome = regexp_replace(nome, '\s+\d{2}$', '')
where matricula like 'EDU-20%'
  and nome ~ '\s+\d{2}$';
