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

import {
  border,
  borderRadius,
  boxShadow,
  lightBlue,
  margin,
  padding,
  white,
} from './css';

interface DatumProps {
  datum: string;
  label: string;
}

/**
 * A single data point
 */
export const Datum: FC<DatumProps> = ({ datum, label }) => {
  return (
    <div
      style={{
        borderRadius,
        border,
        margin,
        overflow: 'hidden',
        zIndex: 1,
        boxShadow,
      }}
    >
      <div
        style={{
          padding: padding * 2,
          backgroundColor: lightBlue,
        }}
      >
        {label}
      </div>

      <div
        style={{
          padding: padding * 2,
          backgroundColor: white,
        }}
      >
        {datum}
      </div>
    </div>
  );
};

/**
 * Wrapper Datum children
 */
export const Data: FC<{
  children: ReactNode[];
}> = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      margin,
    }}
  >
    {children}
  </div>
);
