ALTER TABLE `ledger_events`
  ADD `hashVersion` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `ledger_events`
  ADD `hashPayload` text;
