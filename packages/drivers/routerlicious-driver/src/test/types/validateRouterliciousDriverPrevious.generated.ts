/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by flub generate:typetests in @fluid-tools/build-cli.
 */

import type { TypeOnly, MinimalType, FullType, requireAssignableTo } from "@fluidframework/build-tools";
import type * as old from "@fluidframework/routerlicious-driver-previous/internal";

import type * as current from "../../index.js";

declare type MakeUnusedImportErrorsGoAway<T> = TypeOnly<T> | MinimalType<T> | FullType<T> | typeof old | typeof current | requireAssignableTo<true, true>;

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Function_createRouterliciousDocumentServiceFactory": {"backCompat": false}
 */
declare type current_as_old_for_Function_createRouterliciousDocumentServiceFactory = requireAssignableTo<TypeOnly<typeof current.createRouterliciousDocumentServiceFactory>, TypeOnly<typeof old.createRouterliciousDocumentServiceFactory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IRouterliciousResolvedUrl": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_IRouterliciousResolvedUrl = requireAssignableTo<TypeOnly<old.IRouterliciousResolvedUrl>, TypeOnly<current.IRouterliciousResolvedUrl>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_IRouterliciousResolvedUrl": {"backCompat": false}
 */
declare type current_as_old_for_Interface_IRouterliciousResolvedUrl = requireAssignableTo<TypeOnly<current.IRouterliciousResolvedUrl>, TypeOnly<old.IRouterliciousResolvedUrl>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_ITokenProvider": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_ITokenProvider = requireAssignableTo<TypeOnly<old.ITokenProvider>, TypeOnly<current.ITokenProvider>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_ITokenProvider": {"backCompat": false}
 */
declare type current_as_old_for_Interface_ITokenProvider = requireAssignableTo<TypeOnly<current.ITokenProvider>, TypeOnly<old.ITokenProvider>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_ITokenResponse": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_ITokenResponse = requireAssignableTo<TypeOnly<old.ITokenResponse>, TypeOnly<current.ITokenResponse>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_ITokenResponse": {"backCompat": false}
 */
declare type current_as_old_for_Interface_ITokenResponse = requireAssignableTo<TypeOnly<current.ITokenResponse>, TypeOnly<old.ITokenResponse>>
