/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import * as path from "path";
import { mkdirSync, readFileSync } from "fs";
import { strict as assert } from "assert";
import {
    AcceptanceCondition,
    BaseFuzzTestState,
    createFuzzDescribe,
    createWeightedGenerator,
    Generator,
    generatorFromArray,
    interleave,
    makeRandom,
    performFuzzActions,
    Reducer,
    SaveInfo,
    take,
} from "@fluid-internal/stochastic-test-utils";
import {
    MockFluidDataStoreRuntime,
    MockStorage,
    MockContainerRuntimeFactoryForReconnection,
} from "@fluidframework/test-runtime-utils";
import { IChannelServices } from "@fluidframework/datastore-definitions";
import { PropertySet } from "@fluidframework/merge-tree";
import { SharedString } from "../sharedString";
import { IntervalCollection, IntervalType, SequenceInterval } from "../intervalCollection";
import { SharedStringFactory } from "../sequenceFactory";
import { assertConsistent, Client } from "./intervalUtils";

interface FuzzTestState extends BaseFuzzTestState {
    containerRuntimeFactory: MockContainerRuntimeFactoryForReconnection;
    clients: Client[];
}

interface ClientSpec {
    stringId: string;
}

interface RangeSpec {
    start: number;
    end: number;
}

interface IntervalCollectionSpec {
    collectionName: string;
}

interface AddText extends ClientSpec {
    type: "addText";
    index: number;
    content: string;
}

interface RemoveRange extends ClientSpec, RangeSpec {
    type: "removeRange";
}

// For non-interval collection fuzzing, annotating text would also be useful.

interface AddInterval extends ClientSpec, IntervalCollectionSpec, RangeSpec {
    type: "addInterval";
    // Normally interval ids get autogenerated, but including it here allows tracking
    // what happened to an interval over the course of its lifetime based on the history
    // file, which is useful for debugging test failures.
    id: string;
}

interface ChangeInterval extends ClientSpec, IntervalCollectionSpec, Partial<RangeSpec> {
    type: "changeInterval";
    id: string;
}

interface DeleteInterval extends ClientSpec, IntervalCollectionSpec {
    type: "deleteInterval";
    id: string;
}

interface ChangeProperties extends ClientSpec, IntervalCollectionSpec {
    type: "changeProperties";
    id: string;
    properties: PropertySet;
}

interface ChangeConnectionState extends ClientSpec {
    type: "changeConnectionState";
    connected: boolean;
}

interface Synchronize {
    type: "synchronize";
}

type IntervalOperation = AddInterval | ChangeInterval | DeleteInterval | ChangeProperties;

type TextOperation = AddText | RemoveRange;

type ClientOperation = IntervalOperation | TextOperation | ChangeConnectionState;

type Operation = ClientOperation | Synchronize;

// Note: none of these options are currently exercised, since the fuzz test fails with pretty much
// any configuration due to known bugs. Once shared interval collections are in a better state these
// should be revisited.
interface OperationGenerationConfig {
    /**
     * Maximum length of the SharedString (locally) before no further AddText operations are generated.
     * Note due to concurency, during test execution the actual length of the string may exceed this.
     */
    maxStringLength?: number;
    /**
     * Maximum number of intervals (locally) before no further AddInterval operations are generated.
     * Note due to concurency, during test execution the actual number of intervals may exceed this.
     */
    maxIntervals?: number;
    maxInsertLength?: number;
    intervalCollectionNamePool?: string[];
    propertyNamePool?: string[];
    validateInterval?: number;
}

const defaultOptions: Required<OperationGenerationConfig> = {
    maxStringLength: 1000,
    maxIntervals: 100,
    maxInsertLength: 10,
    intervalCollectionNamePool: ["comments"],
    propertyNamePool: ["prop1", "prop2", "prop3"],
    validateInterval: 100,
};

function makeOperationGenerator(optionsParam?: OperationGenerationConfig): Generator<Operation, FuzzTestState> {
    const options = { ...defaultOptions, ...(optionsParam ?? {}) };
    type ClientOpState = FuzzTestState & { sharedString: SharedString; };

    function isNonEmpty(collection: IntervalCollection<SequenceInterval>): boolean {
        for (const _ of collection) {
            return true;
        }

        return false;
    }

    // All subsequent helper functions are generators; note that they don't actually apply any operations.
    function startPosition({ random, sharedString }: ClientOpState): number {
        return random.integer(0, Math.max(0, sharedString.getLength() - 1));
    }

    function exclusiveRange(state: ClientOpState): RangeSpec {
        const start = startPosition(state);
        const end = state.random.integer(start + 1, state.sharedString.getLength());
        return { start, end };
    }

    function inclusiveRange(state: ClientOpState): RangeSpec {
        const start = startPosition(state);
        const end = state.random.integer(start, Math.max(start, state.sharedString.getLength() - 1));
        return { start, end };
    }

    function propertySet(state: ClientOpState): PropertySet {
        const propNamesShuffled = [...options.propertyNamePool];
        state.random.shuffle(propNamesShuffled);
        const propsToChange = propNamesShuffled.slice(0, state.random.integer(1, propNamesShuffled.length));
        const propSet: PropertySet = {};
        for (const name of propsToChange) {
            propSet[name] = state.random.string(5);
        }
        return propSet;
    }

    function nonEmptyIntervalCollection({ sharedString, random }: ClientOpState): string {
        const nonEmptyLabels = Array.from(sharedString.getIntervalCollectionLabels()).filter((label) => {
            const collection = sharedString.getIntervalCollection(label);
            return isNonEmpty(collection);
        });
        return random.pick(nonEmptyLabels);
    }

    function interval(state: ClientOpState): { collectionName: string; id: string; } {
        const collectionName = nonEmptyIntervalCollection(state);
        const intervals = Array.from(state.sharedString.getIntervalCollection(collectionName));
        const id = state.random.pick(intervals)?.getIntervalId();
        assert(id);

        return {
            id,
            collectionName,
        };
    }

    function addText(state: ClientOpState): AddText {
        const { random, sharedString } = state;
        return {
            type: "addText",
            index: random.integer(0, sharedString.getLength()),
            content: random.string(random.integer(0, options.maxInsertLength)),
            stringId: sharedString.id,
        };
    }

    function removeRange(state: ClientOpState): RemoveRange {
        return { type: "removeRange", ...exclusiveRange(state), stringId: state.sharedString.id };
    }

    function addInterval(state: ClientOpState): AddInterval {
        return {
            type: "addInterval",
            ...inclusiveRange(state),
            collectionName: state.random.pick(options.intervalCollectionNamePool),
            stringId: state.sharedString.id,
            id: state.random.uuid4(),
        };
    }

    function deleteInterval(state: ClientOpState): DeleteInterval {
        return {
            type: "deleteInterval",
            ...interval(state),
            stringId: state.sharedString.id,
        };
    }

    function changeInterval(state: ClientOpState): ChangeInterval {
        const { start, end } = inclusiveRange(state);
        return {
            type: "changeInterval",
            start: state.random.integer(0, 5) === 5 ? undefined : start,
            end: state.random.integer(0, 5) === 5 ? undefined : end,
            ...interval(state),
            stringId: state.sharedString.id,
        };
    }

    function changeProperties(state: ClientOpState): ChangeProperties {
        return {
            type: "changeProperties",
            ...interval(state),
            properties: propertySet(state),
            stringId: state.sharedString.id,
        };
    }

    function changeConnectionState(state: ClientOpState): ChangeConnectionState {
        const stringId = state.sharedString.id;
        const { containerRuntime } = state.clients.find((c) => c.sharedString.id === stringId) ?? {};
        return {
            type: "changeConnectionState",
            stringId,
            // No-ops aren't interesting; always make this flip the connection state.
            connected: containerRuntime?.connected ? false : true,
        };
    }

    const hasAnInterval = ({ sharedString }: ClientOpState): boolean =>
        Array.from(sharedString.getIntervalCollectionLabels()).some((label) => {
            const collection = sharedString.getIntervalCollection(label);
            return isNonEmpty(collection);
        });

    const lengthSatisfies = (criteria: (length: number) => boolean): AcceptanceCondition<ClientOpState> =>
        ({ sharedString }) => criteria(sharedString.getLength());
    const hasNonzeroLength = lengthSatisfies((length) => length > 0);
    const isShorterThanMaxLength = lengthSatisfies((length) => length < options.maxStringLength);

    const hasNotTooManyIntervals: AcceptanceCondition<ClientOpState> = ({ sharedString }) => {
        let intervalCount = 0;
        for (const label of sharedString.getIntervalCollectionLabels()) {
            for (const _ of sharedString.getIntervalCollection(label)) {
                intervalCount++;
                if (intervalCount >= options.maxIntervals) {
                    return false;
                }
            }
        }
        return true;
    };

    const all = <T>(...clauses: AcceptanceCondition<T>[]): AcceptanceCondition<T> =>
        (t: T) => clauses.reduce<boolean>((prev, cond) => prev && cond(t), true);

    const clientBaseOperationGenerator = createWeightedGenerator<Operation, ClientOpState>([
        [addText, 2, isShorterThanMaxLength],
        [removeRange, 1, hasNonzeroLength],
        // [addInterval, 0, all(hasNotTooManyIntervals, hasNonzeroLength)],
        [addInterval, 2, all(hasNotTooManyIntervals, hasNonzeroLength)],
        [deleteInterval, 2, hasAnInterval],
        [changeInterval, 2, all(hasAnInterval, hasNonzeroLength)],
        [changeProperties, 2, hasAnInterval],
        [changeConnectionState, 1],
    ]);

    const clientOperationGenerator = (state: FuzzTestState) =>
        clientBaseOperationGenerator({ ...state, sharedString: state.random.pick(state.clients).sharedString });

    return interleave(
        clientOperationGenerator,
        () => ({ type: "synchronize" }),
        options.validateInterval,
    );
}

interface LoggingInfo {
    /** id of the interval to track over time */
    intervalId: string;
    /** Clients to print */
    clientIds: string[];
}

function logCurrentState(state: FuzzTestState, loggingInfo: LoggingInfo): void {
    for (const id of loggingInfo.clientIds) {
        const { sharedString } = state.clients.find((s) => s.sharedString.id === id) ?? {};
        assert(sharedString);
        const labels = sharedString.getIntervalCollectionLabels();
        const interval = Array.from(labels)
            .map((label) =>
                sharedString.getIntervalCollection(label).getIntervalById(loggingInfo.intervalId))
            .find((result) => result !== undefined);

        console.log(`Client ${id}:`);
        if (interval !== undefined) {
            const start = sharedString.localReferencePositionToPosition(interval.start);
            const end = sharedString.localReferencePositionToPosition(interval.end);
            if (end === start) {
                console.log(`${" ".repeat(start) }x`);
            } else {
                console.log(`${" ".repeat(start) }[${ " ".repeat(end - start - 1) }]`);
            }
        }
        console.log(sharedString.getText());
        console.log("\n");
    }
}

function runIntervalCollectionFuzz(
    generator: Generator<Operation, FuzzTestState>,
    initialState: FuzzTestState,
    saveInfo?: SaveInfo,
    loggingInfo?: LoggingInfo,
): void {
    // Small wrapper to avoid having to return the same state repeatedly; all operations in this suite mutate.
    // Also a reasonable point to inject logging of incremental state.
    const statefully =
        <T>(statefulReducer: (state: FuzzTestState, operation: T) => void): Reducer<T, FuzzTestState> =>
            (state, operation) => {
                if (loggingInfo !== undefined) {
                    logCurrentState(state, loggingInfo);
                    console.log("-".repeat(20));
                    console.log("Next operation:", JSON.stringify(operation, undefined, 4));
                }
                statefulReducer(state, operation);
                return state;
            };

    performFuzzActions(
        generator,
        {
            addText: statefully(({ clients }, { stringId, index, content }) => {
                const { sharedString } = clients.find((c) => c.sharedString.id === stringId) ?? {};
                assert(sharedString);
                sharedString.insertText(index, content);
            }),
            removeRange: statefully(({ clients }, { stringId, start, end }) => {
                const { sharedString } = clients.find((c) => c.sharedString.id === stringId) ?? {};
                assert(sharedString);
                sharedString.removeRange(start, end);
            }),
            addInterval: statefully(({ clients }, { stringId, start, end, collectionName, id }) => {
                const { sharedString } = clients.find((c) => c.sharedString.id === stringId) ?? {};
                assert(sharedString);
                const collection = sharedString.getIntervalCollection(collectionName);
                collection.add(start, end, IntervalType.SlideOnRemove, { intervalId: id });
            }),
            deleteInterval: statefully(({ clients }, { stringId, id, collectionName }) => {
                const { sharedString } = clients.find((c) => c.sharedString.id === stringId) ?? {};
                assert(sharedString);
                const collection = sharedString.getIntervalCollection(collectionName);
                collection.removeIntervalById(id);
            }),
            changeInterval: statefully(({ clients }, { stringId, id, start, end, collectionName }) => {
                const { sharedString } = clients.find((c) => c.sharedString.id === stringId) ?? {};
                assert(sharedString);
                const collection = sharedString.getIntervalCollection(collectionName);
                collection.change(id, start, end);
            }),
            synchronize: statefully(({ containerRuntimeFactory, clients }) => {
                containerRuntimeFactory.processAllMessages();
                assertConsistent(clients);
            }),
            changeConnectionState: statefully(({ clients }, { stringId, connected }) => {
                const { containerRuntime } = clients.find((c) => c.sharedString.id === stringId) ?? {};
                assert(containerRuntime);
                containerRuntime.connected = connected;
            }),
            changeProperties: statefully(({ clients }, { stringId, id, properties, collectionName }) => {
                const { sharedString } = clients.find((c) => c.sharedString.id === stringId) ?? {};
                assert(sharedString);
                const collection = sharedString.getIntervalCollection(collectionName);
                collection.changeProperties(id, { ...properties });
            }),
        },
        initialState,
        saveInfo,
    );
}

const directory = path.join(__dirname, "../../src/test/results");

function getPath(seed: number): string {
    return path.join(directory, `${seed}.json`);
}

// const describeFuzz = createFuzzDescribe({ defaultTestCount: 1000 });
const describeFuzz = createFuzzDescribe({ defaultTestCount: 100 });

describeFuzz("IntervalCollection fuzz testing", ({ testCount }) => {
    before(() => {
        mkdirSync(directory, { recursive: true });
    });

    function runTests(seed: number, generator: Generator<Operation, FuzzTestState>, loggingInfo?: LoggingInfo): void {
        it(`with default config, seed ${seed}`, async () => {
            const numClients = 3;

            const containerRuntimeFactory = new MockContainerRuntimeFactoryForReconnection();
            const clients = Array.from({ length: numClients }, (_, index) => {
                const dataStoreRuntime = new MockFluidDataStoreRuntime();
                const sharedString = new SharedString(
                    dataStoreRuntime,
                    String.fromCharCode(index + 65),
                    SharedStringFactory.Attributes,
                );
                const containerRuntime = containerRuntimeFactory.createContainerRuntime(dataStoreRuntime);
                const services: IChannelServices = {
                    deltaConnection: containerRuntime.createDeltaConnection(),
                    objectStorage: new MockStorage(),
                };

                sharedString.initializeLocal();
                sharedString.connect(services);
                return { containerRuntime, sharedString };
            });

            const initialState: FuzzTestState = {
                clients,
                containerRuntimeFactory,
                random: makeRandom(seed),
            };

            runIntervalCollectionFuzz(
                generator,
                initialState,
                // undefined,
                { saveOnFailure: true, filepath: getPath(seed) },
                loggingInfo,
            );
        });
    }

    function replayTestFromFailureFile(seed: number, intervalId?: string, loggingInfo?: LoggingInfo) {
        const filepath = getPath(seed);
        let operations: Operation[];
        try {
            operations = JSON.parse(readFileSync(filepath).toString());
            if (intervalId) {
                operations = operations.filter((entry) => [undefined, intervalId].includes((entry as any).id));
                operations = operations.filter((entry) => entry.type !== "addText" || entry.content.length > 0);
            }
        } catch (err: any) {
            // Mocha executes skipped suite creation blocks, but whoever's running this suite only cares if
            // the containing block isn't skipped. Report the original error to them from inside a test.
            if (err.message.includes("ENOENT")) {
                it(`with default config, seed ${seed}`, () => {
                    throw err;
                });
                return;
            }
            throw err;
        }

        const generator = generatorFromArray(operations);
        runTests(seed, generator, loggingInfo);
    }

    for (let i = 0; i < testCount; i++) {
        const generator = take(100, makeOperationGenerator({ validateInterval: 10 }));
        runTests(i, generator);
    }

    // Change this seed and unskip the block to replay the actions from JSON on disk.
    // This can be useful for quickly minimizing failure json while attempting to root-cause a failure.
    describe.skip("replay specific seed", () => {
        // const seedToReplay = 8; // 870, 991,
        const seedToReplay = 38;
        replayTestFromFailureFile(
            seedToReplay,
            // "1fd4dbfc-79b1-4b84-aa92-147923d11754",
            // The following line can be uncommented for useful logging output which tracks the provided
            // intervalId over time.
            // { intervalId: "", clientIds: ["A", "B", "C"] },
        );
    });
});
