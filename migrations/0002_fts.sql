CREATE VIRTUAL TABLE `products_fts` USING fts5(
  `name`,
  `search_text`,
  `description`,
  `specs_json`,
  content='products',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER `products_fts_ai` AFTER INSERT ON `products` BEGIN
  INSERT INTO `products_fts`(rowid, `name`, `search_text`, `description`, `specs_json`)
  VALUES (new.`id`, new.`name`, new.`search_text`, new.`description`, new.`specs_json`);
END;

CREATE TRIGGER `products_fts_ad` AFTER DELETE ON `products` BEGIN
  INSERT INTO `products_fts`(`products_fts`, rowid, `name`, `search_text`, `description`, `specs_json`)
  VALUES ('delete', old.`id`, old.`name`, old.`search_text`, old.`description`, old.`specs_json`);
END;

CREATE TRIGGER `products_fts_au` AFTER UPDATE ON `products` BEGIN
  INSERT INTO `products_fts`(`products_fts`, rowid, `name`, `search_text`, `description`, `specs_json`)
  VALUES ('delete', old.`id`, old.`name`, old.`search_text`, old.`description`, old.`specs_json`);
  INSERT INTO `products_fts`(rowid, `name`, `search_text`, `description`, `specs_json`)
  VALUES (new.`id`, new.`name`, new.`search_text`, new.`description`, new.`specs_json`);
END;
