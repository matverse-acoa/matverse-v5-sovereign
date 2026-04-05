CREATE TABLE `chain_anchors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merkleRoot` varchar(64) NOT NULL,
	`txHash` varchar(66),
	`blockNumber` int,
	`contractAddress` varchar(42),
	`status` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	CONSTRAINT `chain_anchors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ledger_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hash` varchar(64) NOT NULL,
	`prevHash` varchar(64) NOT NULL,
	`psi` int NOT NULL,
	`theta` int NOT NULL,
	`cvar` int NOT NULL,
	`pole` int NOT NULL,
	`omega` int NOT NULL,
	`decision` varchar(16) NOT NULL,
	`merkleRoot` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ledger_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `ledger_events_hash_unique` UNIQUE(`hash`)
);
--> statement-breakpoint
CREATE TABLE `merkle_proofs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`merkleRoot` varchar(64) NOT NULL,
	`eventCount` int NOT NULL,
	`proofPath` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `merkle_proofs_id` PRIMARY KEY(`id`),
	CONSTRAINT `merkle_proofs_merkleRoot_unique` UNIQUE(`merkleRoot`)
);
