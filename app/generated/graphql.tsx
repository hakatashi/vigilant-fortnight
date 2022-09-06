import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Bid = {
  __typename?: 'Bid';
  timestamp: Scalars['String'];
  user: Scalars['String'];
};

export type Button = {
  __typename?: 'Button';
  bids?: Maybe<Array<Maybe<Bid>>>;
  connectionId: Scalars['ID'];
  createdAt?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  updatedAt?: Maybe<Scalars['Int']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createButton?: Maybe<Button>;
};


export type MutationCreateButtonArgs = {
  connectionId: Scalars['ID'];
};

export type Query = {
  __typename?: 'Query';
  button?: Maybe<Button>;
};


export type QueryButtonArgs = {
  id: Scalars['ID'];
};

export type CreateButtonMutationVariables = Exact<{
  connectionId: Scalars['ID'];
}>;


export type CreateButtonMutation = { __typename?: 'Mutation', createButton?: { __typename?: 'Button', id: string, createdAt?: number | null, updatedAt?: number | null } | null };

export type GetButtonQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetButtonQuery = { __typename?: 'Query', button?: { __typename?: 'Button', id: string, connectionId: string, createdAt?: number | null, updatedAt?: number | null } | null };


export const CreateButtonDocument = gql`
    mutation createButton($connectionId: ID!) {
  createButton(connectionId: $connectionId) {
    id
    createdAt
    updatedAt
  }
}
    `;

export function useCreateButtonMutation() {
  return Urql.useMutation<CreateButtonMutation, CreateButtonMutationVariables>(CreateButtonDocument);
};
export const GetButtonDocument = gql`
    query getButton($id: ID!) {
  button(id: $id) {
    id
    connectionId
    createdAt
    updatedAt
  }
}
    `;

export function useGetButtonQuery(options: Omit<Urql.UseQueryArgs<GetButtonQueryVariables>, 'query'>) {
  return Urql.useQuery<GetButtonQuery, GetButtonQueryVariables>({ query: GetButtonDocument, ...options });
};