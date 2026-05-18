
import {
    Client, Collection, CollectionChanged, Event, FacadeOf, HasFacadeAccessor,
    JsonObject, ReducerCallback, ReducibleOf, Response, ReducibleInterface
} from '@luminix/support';

import { ModelType as Model, HttpMethod, ModelSaveOptions, ModelType, ModelAttribute } from '@luminix/core';
// import { ReducerMethodMap } from '@luminix/support/types/Mixins/Reducible';
// import { ModelSaveOptions } from '@luminix/core/dist/types/Model';
// import { HttpMethod } from '@luminix/core/dist/types/Route';
// import { JsonObject } from '@luminix/core/dist/types/Support';


export type UseFormOptions<T extends object> = {
    initialValues: T,
    preventDefault?: boolean,
    onSubmit?: (data: T) => false | void | Promise<false | void>,
    onChange?: (data: T) => void,
    onError?: (error: unknown) => void,
    onSuccess?: (response: Response) => void,
    tap?: (client: Client) => Client,
    transformPayload?: (payload: T) => T,
    action?: string,
    method?: HttpMethod,
    errorBag?: string,
    autoSave?: boolean,
    debounce?: number,
    debug?: boolean,
};

export type FormProps<T extends object> = Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onChange' | 'onError' | 'action' | 'method' | 'children'> & UseFormOptions<T> & {
    children?: ((data: T, form: Omit<UseForm<T>, 'data'>) => React.ReactNode) | React.ReactNode,
    ref?: React.MutableRefObject<{
        applyMiddlewares: (client: Client) => Client,
    }>,
};


export type ModelFormProps = Omit<FormProps<JsonObject>, 'initialValues' | 'action' | 'method' | 'children'> & {
    item: Model,
    children?: React.ReactNode | ((data: JsonObject, form: Omit<UseForm<JsonObject>, 'data'>) => React.ReactNode),
    getSaveOptions?: (data: JsonObject) => ModelSaveOptions,
    hideSubmit?: boolean,
    submitText?: string,
    confirmed?: string|string[],
    submitComponent?: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>,
};

export type InteractiveFormProps = Pick<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'action' | 'method'> & {
    ref: React.MutableRefObject<HTMLFormElement>,
};

export type InteractiveInputProps = Pick<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'onChange'>;

export type InteractiveCheckboxProps = Pick<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'checked' | 'onChange'>;

export type InteractiveRadioProps = Pick<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'checked' | 'onChange'>;

export type InteractiveTextareaProps = Pick<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'value' | 'onChange'>;

export type InteractiveSelectProps = Pick<React.SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'value' | 'onChange'>;

export type UseForm<T extends object> = {
    /** The form data. */
    data: T,
    /** Sets a property in the form data. Could be used to set nested values by using dot notation, or set the whole state by using path = '.'. */
    setProp: (path: string, value: unknown) => void,
    /** A function that returns the props for the form. */
    formProps: () => InteractiveFormProps,
    /** A function that returns the props for an input or select. */
    inputProps: (name: string, sanitizeFn?: (event: React.ChangeEvent<HTMLInputElement>) => string) => InteractiveInputProps,
    /** A function that returns the props for a checkbox. */
    checkboxProps: (name: string, value?: string | number | readonly string[]) => InteractiveCheckboxProps,
    /** A function that returns the props for a radio. */
    radioProps: (name: string, value: string) => InteractiveRadioProps,
    /** A function that returns the props for a textarea. */
    textareaProps: (name: string, sanitizeFn?: (event: React.ChangeEvent<HTMLTextAreaElement>) => string) => InteractiveTextareaProps,
    /** A function that returns the props for a select. */
    selectProps: (name: string) => InteractiveSelectProps,
    /** A function that returns the props for a datetime-local input. */
    datetimeLocalProps: (name: string) => InteractiveInputProps,
    /** A function to subscribe a middleware to the form submission. */
    subscribe: (middleware: (client: Client) => Client) => () => void,
    /** A function to apply all the subscribed middlewares to the given client. */
    applyMiddlewares: (client: Client) => Client,

    /** Whether the form is currently submitting. */
    isSubmitting: boolean,
    /** The current form element. */
    form?: HTMLFormElement,
    /** The current error bag. */
    errorBag?: string,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
};

export type FormContextValue<T extends object> = {
    form: UseForm<T>,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanitizableInput<T = any, R = any> = {
    sanitize?: (e: T) => R,
}


export declare class InputPropTypeMap {
    
    checkbox: React.InputHTMLAttributes<HTMLInputElement>;
    color: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    date: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    ['datetime-local']: React.InputHTMLAttributes<HTMLInputElement>;
    email: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    file: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    hidden: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    image: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    month: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    number: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    password: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    radio: React.InputHTMLAttributes<HTMLInputElement> & {
        options: { value: string, label: string }[],
    };
    range: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    search: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    select: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
        options: { value: string, label: string }[],
    };
    tel: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    text: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    textarea: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> & SanitizableInput<React.ChangeEvent<HTMLTextAreaElement>>;
    time: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    url: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;
    week: React.InputHTMLAttributes<HTMLInputElement> & SanitizableInput<React.ChangeEvent<HTMLInputElement>>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
}



export type HTMLInputProps<T extends keyof InputPropTypeMap> = Omit<InputPropTypeMap[T], 'type' | 'children' | 'name' | 'checked'>;

export type InputProps<T extends keyof InputPropTypeMap> = HTMLInputProps<T> & {
    name: string,
    type: T,
    label?: string,
    // error?: string,
};

export type ModelInputProps<T extends keyof InputPropTypeMap> = HTMLInputProps<T> & {
    name: string,
    label?: string,
    type?: T,
}


export type FormMiddleware = (client: Client) => Client;
export type MiddlewareManager = ReducibleInterface<Record<string, ReducerCallback<Client>>> & Record<string, ReducerCallback<Client>>;

export declare class FormServiceBase {

    getFormInputComponent(type: string): React.ElementType;
    getSubmitComponent(): React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>;
    getSubmitProps(): React.ButtonHTMLAttributes<HTMLButtonElement>;
    getDefaultInputsForModel(item: ModelType, confirmed?: string[]): InputProps<keyof InputPropTypeMap>[];
    ensureFrontendRequestsAreStateful(): void;
    create(callback: (id: string) => void): () => void;
    subscribe(id: string, middleware: (client: Client) => Client): () => void;
    listen(id: string, callback: (e: Event<CollectionChanged<FormMiddleware>, Collection<FormMiddleware>>) => void): () => void;
    applyMiddlewares(id: string, client: Client): Client;

}

export type FormServicesReducers = {

    expandUseFormProps<T extends object>(state: Partial<UseForm<T>>, data: T): Partial<UseForm<T>>;

    replaceFormInputComponent(component: React.ElementType, type: string): React.ElementType;

    replaceSubmitComponent(
        component: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>
    ): React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>;

    replaceSubmitProps(
        props: React.ButtonHTMLAttributes<HTMLButtonElement>
    ): React.ButtonHTMLAttributes<HTMLButtonElement>;
    
    getDefaultInputProps(
        props: ModelInputProps<keyof InputPropTypeMap>,
        data: {
            attributes: Collection<ModelAttribute>,
            confirmed: string[],
            item: ModelType,
            key: string,
        }
    ): ModelInputProps<keyof InputPropTypeMap> | ModelInputProps<keyof InputPropTypeMap>[];

    mapAttributeCastToInputTypes(
        map: Record<string, keyof InputPropTypeMap>,
        item: ModelType,
        attribute: ModelAttribute,
    ): Record<string, keyof InputPropTypeMap>;

    mapAttributeTypeToInputType(
        map: Record<string, keyof InputPropTypeMap>,
        item: ModelType,
        attribute: ModelAttribute,
    ): Record<string, keyof InputPropTypeMap>;

    // selectDefaultInputsFor${Model}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [reducer: string]: ReducerCallback;

};

export type FormServiceInterface = ReducibleOf<typeof FormServiceBase, FormServicesReducers>;

export type FormsFacadeInterface = FacadeOf<InstanceType<FormServiceInterface>, HasFacadeAccessor>;
