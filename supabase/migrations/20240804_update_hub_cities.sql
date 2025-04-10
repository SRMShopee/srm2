-- Remover cidades existentes para o hub específico
DELETE FROM cities WHERE hub_id = '8ead7d90-3e05-47a3-b76f-67d5e1e74201';

-- Inserir novas cidades para o hub
INSERT INTO cities (name, cep, hub_id) VALUES
('ARARICA', '93880-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('BOM PRINCIPIO', '95765-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('CAMPO BOM', '93700-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('CAPELA DE SANTANA', '95745-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('DOIS IRMAOS', '93950-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('ESTANCIA VELHA', '93600-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('ESTEIO', '93260-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('HARMONIA', '95785-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('IGREJINHA', '95650-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('IVOTI', '93900-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('LINDOLFO COLLOR', '93940-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('MONTENEGRO', '95780-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('MORRO REUTER', '93990-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('NOVA HARTZ', '93890-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('NOVO HAMBURGO', '93300-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('PARECI NOVO', '95783-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('PAROBE', '95630-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('PICADA CAFE', '95175-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('PORTAO', '93180-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('PRESIDENTE LUCENA', '93945-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('RIOZINHO', '95695-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('ROLANTE', '95690-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('SANTA MARIA DO HERVAL', '93995-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('SAO JOSE DO HORTENCIO', '95755-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('SAO LEOPOLDO', '93000-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('SAO SEBASTIAO DO CAI', '95760-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('SAPIRANGA', '93800-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('SAPUCAIA DO SUL', '93200-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('TAQUARA', '95600-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('TRES COROAS', '95660-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201');