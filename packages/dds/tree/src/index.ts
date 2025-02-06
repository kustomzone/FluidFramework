/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

export {
	ValueSchema,
	type Revertible,
	CommitKind,
	RevertibleStatus,
	type CommitMetadata,
	type RevertibleFactory,
	type RevertibleAlphaFactory,
	type RevertibleAlpha,
} from "./core/index.js";

import type {
	Listeners as EventListeners,
	IsListener as EventIsListener,
	Listenable as EventListenable,
	Off as EventOff,
} from "@fluidframework/core-interfaces";

/**
 * {@inheritdoc @fluidframework/core-interfaces#Listeners}
 * @public
 * @deprecated Deprecated in `@fluidframework/tree`. Consider importing from `fluid-framework` or `@fluidframework/core-interfaces` instead.
 */
export type Listeners<T extends object> = EventListeners<T>;
/**
 * {@inheritdoc @fluidframework/core-interfaces#IsListener}
 * @public
 * @deprecated Deprecated in `@fluidframework/tree`. Consider importing from `fluid-framework` or `@fluidframework/core-interfaces` instead.
 */
export type IsListener<T> = EventIsListener<T>;
/**
 * {@inheritdoc @fluidframework/core-interfaces#Listenable}
 * @public
 * @deprecated Deprecated in `@fluidframework/tree`. Consider importing from `fluid-framework` or `@fluidframework/core-interfaces` instead.
 */
export type Listenable<T extends object> = EventListenable<T>;
/**
 * {@inheritdoc @fluidframework/core-interfaces#Off}
 * @public
 * @deprecated Deprecated in `@fluidframework/tree`. Consider importing from `fluid-framework` or `@fluidframework/core-interfaces` instead.
 */
export type Off = EventOff;

export {
	TreeStatus,
	TreeCompressionStrategy,
	type TreeIndex,
	type TreeIndexKey,
	type TreeIndexNodes,
} from "./feature-libraries/index.js";

export {
	type ITreeInternal,
	type SharedTreeOptions,
	type ForestType,
	type SharedTreeFormatOptions,
	SharedTreeFormatVersion,
	Tree,
	type RunTransaction,
	type ForestOptions,
	getBranch,
	type BranchableTree,
	type TreeBranchFork,
	independentInitializedView,
	type ViewContent,
	TreeAlpha,
	independentView,
	ForestTypeOptimized,
	ForestTypeExpensiveDebug,
	ForestTypeReference,
	type IChannelView,
} from "./shared-tree/index.js";

export {
	TreeArrayNode,
	type Unhydrated,
	IterableTreeArrayContent,
	TreeNode,
	type ViewableTree,
	type ITree,
	type TreeNodeSchema,
	TreeViewConfiguration,
	type ITreeViewConfiguration,
	type ITreeConfigurationOptions,
	type TreeView,
	type TreeViewEvents,
	SchemaFactory,
	SchemaFactoryAlpha,
	type SchemaFactoryObjectOptions,
	type ImplicitFieldSchema,
	type TreeFieldFromImplicitField,
	type TreeChangeEvents,
	type NodeFromSchema,
	type TreeMapNode,
	type InsertableTreeNodeFromImplicitAllowedTypes,
	type TreeLeafValue,
	FieldKind,
	FieldSchema,
	type FieldSchemaMetadata,
	type ImplicitAllowedTypes,
	type InsertableTreeFieldFromImplicitField,
	type InsertableTypedNode,
	NodeKind,
	type TreeObjectNode,
	type TreeNodeFromImplicitAllowedTypes,
	type TreeNodeSchemaClass,
	type SchemaCompatibilityStatus,
	type FieldProps,
	type InternalTreeNode,
	type WithType,
	type NodeChangedData,
	// Types not really intended for public use, but used in links.
	// Can not be moved to internalTypes since doing so causes app code to throw errors like:
	// Error: src/simple-tree/objectNode.ts:72:1 - (ae-unresolved-link) The @link reference could not be resolved: The package "@fluidframework/tree" does not have an export "TreeNodeApi"
	type TreeNodeApi,
	type TreeNodeSchemaCore,
	// Types not really intended for public use, but used in inferred types exposed in the public API.
	// Can not be moved to internalTypes since doing so causes app code to throw errors like:
	// error TS2742: The inferred type of 'Inventory' cannot be named without a reference to '../node_modules/@fluidframework/tree/lib/internalTypes.js'. This is likely not portable. A type annotation is necessary.
	type AllowedTypes,
	type TreeObjectNodeUnsafe,
	type InsertableTreeNodeFromImplicitAllowedTypesUnsafe,
	type TreeArrayNodeUnsafe,
	type TreeMapNodeUnsafe,
	type InsertableObjectFromSchemaRecordUnsafe,
	type InsertableTreeFieldFromImplicitFieldUnsafe,
	type FieldSchemaUnsafe,
	type TreeNodeSchemaClassUnsafe,
	type InsertableTreeNodeFromAllowedTypesUnsafe,
	// System types (not in Internal types for various reasons, like doc links or cannot be named errors).
	type typeSchemaSymbol,
	type TreeNodeSchemaNonClass,
	// Recursive Schema APIs
	type ValidateRecursiveSchema,
	type FixRecursiveArraySchema,
	// Index APIs
	type SimpleTreeIndex,
	type IdentifierIndex,
	createSimpleTreeIndex,
	createIdentifierIndex,
	// experimental @alpha APIs:
	adaptEnum,
	enumFromStrings,
	singletonSchema,
	type UnsafeUnknownSchema,
	type TreeViewAlpha,
	type InsertableField,
	type Insertable,
	type InsertableContent,
	type FactoryContent,
	type FactoryContentObject,
	type ReadableField,
	type ReadSchema,
	// test recursive schema for checking that d.ts files handles schema correctly
	test_RecursiveObject,
	test_RecursiveObject_base,
	test_RecursiveObjectPojoMode,
	// Beta APIs
	TreeBeta,
	type TreeChangeEventsBeta,
	type VerboseTreeNode,
	type EncodeOptions,
	type ParseOptions,
	type VerboseTree,
	extractPersistedSchema,
	comparePersistedSchema,
	type ConciseTree,
	// Back to normal types
	type JsonTreeSchema,
	type JsonSchemaId,
	type JsonNodeSchema,
	type JsonNodeSchemaBase,
	type JsonLeafNodeSchema,
	type JsonMapNodeSchema,
	type JsonArrayNodeSchema,
	type JsonObjectNodeSchema,
	type JsonFieldSchema,
	type JsonSchemaRef,
	type JsonRefPath,
	type JsonSchemaType,
	type JsonLeafSchemaType,
	getJsonSchema,
	type LazyItem,
	type Unenforced,
	type SimpleNodeSchemaBase,
	type SimpleTreeSchema,
	type SimpleNodeSchema,
	type SimpleFieldSchema,
	type SimpleLeafNodeSchema,
	type SimpleMapNodeSchema,
	type SimpleArrayNodeSchema,
	type SimpleObjectNodeSchema,
	normalizeAllowedTypes,
	getSimpleSchema,
	type ReadonlyArrayNode,
	type InsertableTreeNodeFromAllowedTypes,
	type Input,
	type TreeBranch,
	type TreeBranchEvents,
	asTreeViewAlpha,
	type NodeSchemaOptions,
	type NodeSchemaMetadata,
	type ITreeAlpha,
	type TransactionConstraint,
	type NodeInDocumentConstraint,
	type RunTransactionParams,
	type VoidTransactionCallbackStatus,
	type TransactionCallbackStatus,
	type TransactionResult,
	type TransactionResultExt,
	type TransactionResultSuccess,
	type TransactionResultFailed,
	rollback,
} from "./simple-tree/index.js";
export {
	SharedTree,
	configuredSharedTree,
	SharedTreeAttributes,
	SharedTreeFactoryType,
} from "./treeFactory.js";

export {
	type ICodecOptions,
	type JsonValidator,
	type SchemaValidationFunction,
	FluidClientVersion,
} from "./codec/index.js";
export { noopValidator } from "./codec/index.js";
export { typeboxValidator } from "./external-utilities/index.js";

export {
	type RestrictiveReadonlyRecord,
	type RestrictiveStringRecord,
	type MakeNominal,
	type IsUnion,
	type UnionToIntersection,
	type UnionToTuple,
	type PopUnion,
} from "./util/index.js";

import * as InternalTypes from "./internalTypes.js";
export {
	/**
	 * Contains types used by the API, but which serve mechanical purposes and do not represent semantic concepts.
	 * They are used internally to implement API aspects, but are not intended for use by external consumers.
	 */
	InternalTypes,
};

// Internal/System types:
// These would be put in `internalTypes` except doing so tents to cause errors like:
// The inferred type of 'NodeMap' cannot be named without a reference to '../../node_modules/@fluidframework/tree/lib/internalTypes.js'. This is likely not portable. A type annotation is necessary.
export type { MapNodeInsertableData } from "./simple-tree/index.js";

export type { JsonCompatible, JsonCompatibleObject } from "./util/index.js";
