// Copyright 2021-2022 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useQuery } from '@tanstack/react-query';
import { say } from 'generated-react/dist/eliza-ElizaService_connectquery';
import type { FC } from 'react';

import { Data, Datum } from './datum';
import { Indicator, Indicators } from './indicator';
import { Page } from './page';

/**
 * This example demonstrates a basic usage of Connect-Query with `useQuery`
 */
export const Example: FC = () => {
  const {
    status,
    fetchStatus,
    error,
    //^? const error: ConnectError | null
    data,
    //^? const data: SayResponse | undefined
  } = useQuery(say.useQuery({}));
  //           ^? const say: UnaryHooks<SayRequest, SayResponse>

  return (
    <Page>
      <Indicators label="queryStatus">
        <Indicator label="loading" parent={status} />
        <Indicator label="success" parent={status} />
        <Indicator label="error" parent={status} />
      </Indicators>

      <Indicators label="fetchStatus">
        <Indicator label="fetching" parent={fetchStatus} />
        <Indicator label="idle" parent={fetchStatus} />
        <Indicator label="paused" parent={fetchStatus} />
      </Indicators>

      <Data>
        <Datum label="data" datum={JSON.stringify(data)} />
        <Datum label="error" datum={JSON.stringify(error)} />
      </Data>
    </Page>
  );
};
