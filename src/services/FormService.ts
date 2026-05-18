import { Reducible, Str, Collection, Client, Event, CollectionChanged } from '@luminix/support';
import { collect, Model, ModelAttribute, ModelType } from '@luminix/core';

import { FormMiddleware, FormServiceBase, FormServiceInterface, InputPropTypeMap, MiddlewareManager } from '../types/Form';

import Checkbox from '../components/Form/Input/Checkbox';
import DatetimeLocal from '../components/Form/Input/DatetimeLocal';
import File from '../components/Form/Input/File';
import Radio from '../components/Form/Input/Radio';
import Select from '../components/Form/Input/Select';
import Textarea from '../components/Form/Input/Textarea';
import Text from '../components/Form/Input/Text';
import Csrf from '../components/Form/Input/Csrf';
import Submit from '../components/ModelForm/Submit';


class RawFormService implements FormServiceBase {

    private includesCsrfToken = false;

    //private middlewares: MiddlewareStorage = {};

    private manager: MiddlewareManager;

    constructor() {
        this.manager = new (Reducible(class {}))();
    }
    
    getFormInputComponent(type: string): React.ElementType {
        return this.thisAny().replaceFormInputComponent(
            this.switchInputType(type),
            type
        );
    }

    getSubmitComponent(): React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>> {
        return this.thisAny().replaceSubmitComponent(Submit);
    }

    getSubmitProps(): React.ButtonHTMLAttributes<HTMLButtonElement> {
        return this.thisAny().replaceSubmitProps({ style: { marginTop: '1rem' } });
    }

    getDefaultInputsForModel(item: ModelType, confirmed: string[] = []) {
        const modelType = item.getType();
        const attributes = collect(Model.schema(modelType).attributes);

        const basePropsArray = item.fillable.flatMap((key) => {
            return this.thisAny().getDefaultInputProps(
                this.makeFormAttributesFor(key, { attributes, confirmed, item }),
                { attributes, confirmed, item, key }
            );
        });

        if (this.includesCsrfToken) {
            basePropsArray.unshift({
                type: 'csrf',
            });
        }

        return this.thisAny()[`selectDefaultInputsFor${Str.studly(modelType)}`](basePropsArray, item);
    }

    ensureFrontendRequestsAreStateful() {
        this.includesCsrfToken = true;
    }

    private thisAny() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this as any;
    }

    private switchInputType(type: keyof InputPropTypeMap) {
        return {
            select: Select,
            radio: Radio,
            checkbox: Checkbox,
            textarea: Textarea,
            'datetime-local': DatetimeLocal,
            file: File,
            text: Text,
            csrf: Csrf,
        }[type] || Text;
    }


    private makeFormAttributesFor(
        key: string, 
        { attributes, item, confirmed }: { attributes: Collection<ModelAttribute>, item: ModelType, confirmed: string[] }
    ) {
        const baseProps = ((key) => {
            const attribute = attributes.where('name', key).first();

            const id = `luminix-form-${item.getType()}-${item.getKey() || 'new'}-${key}`;

            if (!attribute) {
                return null;
            }

            const castTypeMap: Record<string, { type: string, addedAttributes?: object }> = this.thisAny().mapAttributeCastToInputTypes({
                date: { type: 'date' },
                datetime: { type: 'datetime-local' },
                timestamp: { type: 'datetime-local' },
                hashed: {
                    type: 'password',
                    addedAttributes: {
                        autoComplete: 'new-password',
                    },
                },
                int: { type: 'number' },
                float: { type: 'number' },
                boolean: { type: 'checkbox' },
            }, item, attribute);

            if (attribute.cast && attribute.cast in castTypeMap) {
                const { type, addedAttributes = {} } = castTypeMap[attribute.cast];
                return {
                    name: key,
                    type,
                    label: Str.human(key),
                    id,
                    ...addedAttributes,
                };
            }

            const typeMap: Record<string, string> = this.thisAny().mapAttributeTypeToInputTypes({
                'tinyint(1)': 'checkbox',
                int: 'number',
                float: 'number',
                timestamp: 'datetime-local',
                text: 'textarea',
                tinytext: 'textarea',
                mediumtext: 'textarea',
                longtext: 'textarea',
                date: 'date',
            }, item, attribute);

            if (attribute.type && attribute.type in typeMap) {
                return {
                    name: key,
                    type: typeMap[attribute.type],
                    label: Str.human(key),
                    id,
                };
            }

            if (attribute.type?.startsWith('enum(')) {
                // match the interior of enum(*)
                const match = attribute.type.match(/enum\((.*)\)/);
                if (match) {
                    return {
                        name: key,
                        type: 'select',
                        label: Str.human(key),
                        id,
                        options: [
                            { label: '-- Select a value --', value: '' },
                            ...match[1].split(',').map((opt) => {
                                const unquoted = opt.replace(/['"]+/g, '');
                                return { label: Str.human(unquoted.trim()), value: unquoted.trim() };
                            })
                        ],
                    };
                }
            }

            return {
                name: key,
                type: 'text',
                label: Str.human(key),
                id,
            };
        })(key);

        if (confirmed.includes(key) && baseProps) {
            return [
                baseProps,
                {
                    ...baseProps,
                    name: `${key}_confirmation`,
                    label: `Confirm ${baseProps.label}`,
                    id: `luminix-form-${item.getType()}-${item.getKey() || 'new'}-${key}-confirmation`,
                }
            ];
        }

        return baseProps;
    }

    private uuid() {
        return Math.random().toString(36).substring(2);
    }

    create(callback: (id: string) => void) {
        const id = this.uuid();
        callback(id);
        return () => {
            this.manager.clearReducer(id);
        }
    }

    subscribe(id: string, middleware: FormMiddleware) {
        return this.manager.reducer(id, middleware);
    }

    listen(id: string, callback: (e: Event<CollectionChanged<FormMiddleware>, Collection<FormMiddleware>>) => void) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return this.manager.getReducer(id).on('change', callback as any);
    }

    applyMiddlewares(id: string, client: Client) {
        // return this.middlewares[id].reduce((client, middleware) => middleware(client!), client)!;
        return this.manager[id](client);
    }


}

const FormService: FormServiceInterface = Reducible(RawFormService);

export default FormService;
