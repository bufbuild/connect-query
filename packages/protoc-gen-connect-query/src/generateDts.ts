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

import type { DescFile, DescService } from '@bufbuild/protobuf';
import { MethodKind } from '@bufbuild/protobuf';
import type { Schema } from '@bufbuild/protoplugin';
import { localName } from '@bufbuild/protoplugin/ecmascript';

import type { PluginInit } from './utils';

/**
 * Handles generating a TypeScript Declaration file for a given Schema, DescFile (protobuf definition) and protobuf Service.
 */
const generateServiceFile =
  (schema: Schema, protoFile: DescFile) => (service: DescService) => {
    const f = schema.generateFile(
      `${protoFile.name}-${localName(service)}_connectquery.d.ts`,
    );

    f.preamble(protoFile);

    service.methods.forEach((method) => {
      switch (method.methodKind) {
        case MethodKind.Unary:
          {
            f.print(
              `export const `,
              localName(method),
              `: `,
              f.import('UnaryHooks', '@bufbuild/connect-query'),
              `<`,
              method.input,
              `, `,
              method.output,
              `>;`,
            );
          }
          break;

        default:
          return;
      }
    });
  };

/**
 * This function generates the TypeScript Definition output files
 */
export const generateDts: PluginInit['generateDts'] = (schema) => {
  schema.files.forEach((protoFile) => {
    protoFile.services.forEach(generateServiceFile(schema, protoFile));
  });
};
