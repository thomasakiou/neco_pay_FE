export interface State {
    id: number;
    code: string;
    state: string;
    capital: string;
    active: boolean;
}

export interface StateCreate {
    code: string;
    state: string;
    capital: string;
}

export interface StateUpdate extends StateCreate { }
