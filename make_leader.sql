-- Прави потребител ръководител (изпълнява се в SQL Editor, смени имейла)
update profiles set role = 'leader'
where id = (select id from auth.users where email = 'teacher@example.com');
