import { vi, describe, expect, it, beforeEach } from 'vitest';

vi.mock('@luminix/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@luminix/core')>();
    return {
        ...actual,
        Model: { schema: vi.fn() },
    };
});

import { Model, ModelAttribute, ModelType } from '@luminix/core';

import FormService from '../../services/FormService';
import { InputPropTypeMap } from '../../types/Form';

const makeItem = () => ({
    getType: () => 'post',
    getKey: () => 1,
    fillable: ['body'],
} as unknown as ModelType);

describe('FormService reducers', () => {

    beforeEach(() => {
        vi.mocked(Model.schema).mockReturnValue({
            attributes: [{ name: 'body', type: 'text' }],
        } as unknown as ReturnType<typeof Model.schema>);
    });

    it('runs the reducer registered under the name declared in FormServicesReducers', () => {
        const service = new FormService();

        // The reducers reach the callback as immer drafts, revoked once the reduction
        // ends — copy what is asserted on while the callback still holds a live one.
        const calls: { map: Record<string, string>, attribute: string }[] = [];

        // `mapAttributeTypeToInputTypes` is the name `FormServicesReducers` declares.
        // The index signature on that type accepts any string, so nothing but this
        // test catches the runtime call drifting away from the declared name.
        service.reducer('mapAttributeTypeToInputTypes', (map: Record<string, keyof InputPropTypeMap>, _item: ModelType, attribute: ModelAttribute) => {
            calls.push({ map: { ...map }, attribute: attribute.name });
            return map;
        });

        service.getDefaultInputsForModel(makeItem());

        expect(calls).toHaveLength(1);
        expect(calls[0].map).toMatchObject({ text: 'textarea' });
        expect(calls[0].attribute).toBe('body');
    });

    it('generates the input with the type the reducer put in the map', () => {
        const service = new FormService();

        service.reducer('mapAttributeTypeToInputTypes', (map) => ({ ...map, text: 'text' }));

        const [input] = service.getDefaultInputsForModel(makeItem());

        expect(input.type).toBe('text');
    });

    it('falls back to the built-in map when no reducer is registered', () => {
        const service = new FormService();

        const [input] = service.getDefaultInputsForModel(makeItem());

        expect(input.type).toBe('textarea');
    });

});
