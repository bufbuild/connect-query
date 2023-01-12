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

import type { FC, ReactNode } from 'react';

import { border, borderRadius, boxShadow, margin } from './css';

/**
 * a single Indicator
 */
export const Indicator = <T extends string, U extends T>({
  label,
  parent,
}: {
  label: U;
  parent: T;
}) => {
  const height = '50px';
  const active = label === parent;

  return (
    <div
      style={{
        width: 100,
        height,
        border,
        borderRadius,
        backgroundColor: active ? '#C4E8FC' : '#FFFFFF',
        boxShadow,
        margin,
        textAlign: 'center',
        lineHeight: height,
      }}
    >
      {label}
    </div>
  );
};

/**
 * A wrapper for `Indicator`s
 */
export const Indicators: FC<{
  children: ReactNode;
  label: string;
}> = ({ children, label }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin,
      }}
    >
      <div
        style={{
          textAlign: 'center',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
};
