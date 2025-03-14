/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/core-utils/internal";
import type { IIdCompressor } from "@fluidframework/id-compressor";
import { assertIsStableId, isStableId } from "@fluidframework/id-compressor/internal";

import { brand, extractFromOpaque } from "../../util/index.js";

import type { LocalNodeIdentifier, StableNodeIdentifier } from "./nodeKey.js";

/**
 * An object which handles the generation of node identifiers as well as conversion between their two types ({@link StableNodeIdentifier} and {@link LocalNodeIdentifier}).
 */
export interface NodeIdentifierManager {
	/**
	 * Generate a {@link StableNodeIdentifier}.
	 */
	generateLocalNodeIdentifier(): LocalNodeIdentifier;

	/**
	 * Convert the given {@link StableNodeIdentifier} into its {@link LocalNodeIdentifier} form.
	 */
	localizeNodeIdentifier(identifier: StableNodeIdentifier): LocalNodeIdentifier;

	/**
	 * Convert the given {@link LocalNodeIdentifier} into its {@link StableNodeIdentifier} form.
	 */
	stabilizeNodeIdentifier(identifier: LocalNodeIdentifier): StableNodeIdentifier;

	/**
	 * Attempts to recompress a {@link StableNodeIdentifier}.
	 * @param identifier - The identifier that is attempted to recompress.
	 * @returns The `{@link LocalNodeIdentifier}` associated with `identifier` or undefined if the identifier was not generated by any session known to this compressor.
	 */
	tryLocalizeNodeIdentifier(identifier: string): LocalNodeIdentifier | undefined;
}

/**
 * Creates a {@link NodeIdentifierManager} from the given {@link IIdCompressor}.
 * @param idCompressor - the compressor to use for identifier generation, compression, and decompression.
 * If undefined, then attempts to generate or convert identifiers will throw an error.
 */
export function createNodeIdentifierManager(
	idCompressor?: IIdCompressor | undefined,
): NodeIdentifierManager {
	return {
		generateLocalNodeIdentifier: () => {
			assert(
				idCompressor !== undefined,
				0x6e4 /* Runtime IdCompressor must be available to generate local node identifiers */,
			);
			return brand(idCompressor.generateCompressedId());
		},

		localizeNodeIdentifier: (identifier: StableNodeIdentifier) => {
			assert(
				idCompressor !== undefined,
				0x6e5 /* Runtime IdCompressor must be available to convert node identifiers */,
			);
			return brand(idCompressor.recompress(identifier));
		},

		stabilizeNodeIdentifier: (identifier: LocalNodeIdentifier) => {
			assert(
				idCompressor !== undefined,
				0x6e6 /* Runtime IdCompressor must be available to convert node identifiers */,
			);
			return brand(
				// TODO: The assert below is required for type safety but is maybe slow
				assertIsStableId(idCompressor.decompress(extractFromOpaque(identifier))),
			);
		},
		tryLocalizeNodeIdentifier: (identifier: string) => {
			assert(
				idCompressor !== undefined,
				0x6e9 /* Runtime IdCompressor must be available to convert node identifiers */,
			);
			if (isStableNodeIdentifier(identifier)) {
				const compressedIdentifier = idCompressor.tryRecompress(identifier);
				if (compressedIdentifier !== undefined) {
					return brand(compressedIdentifier);
				}
			}
		},
	};
}

export function isStableNodeIdentifier(
	identifier: string,
): identifier is StableNodeIdentifier {
	return isStableId(identifier);
}
