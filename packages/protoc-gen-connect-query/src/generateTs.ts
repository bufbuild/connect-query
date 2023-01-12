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
import {
  literalString,
  localName,
  makeJsDoc,
} from '@bufbuild/protoplugin/ecmascript';

import type { PluginInit } from './utils';

/**
 * Handles generating a source code file for a given Schema, DescFile (protobuf definition) and protobuf Service.
 *
 * By pure luck, this file happens to be completely valid JavaScript since all the types are inferred.
 */
const generateServiceFile =
  (schema: Schema, protoFile: DescFile, extension: 'js' | 'ts') =>
  (service: DescService) => {
    const f = schema.generateFile(
      `${protoFile.name}-${localName(service)}_connectquery.${extension}`,
    );
    f.preamble(protoFile);

    f.print(`export const typeName = ${literalString(service.typeName)};`);
    f.print();

    const { MethodKind: rtMethodKind } = schema.runtime;
    service.methods
      .filter((method) => method.methodKind === MethodKind.Unary)
      .forEach((method, index, filteredMethods) => {
        // TODO idempotency
        f.print(makeJsDoc(method));
        f.print(
          `export const ${localName(method)} = `,
          f.import('createQueryService', '@bufbuild/connect-query'),
          `({`,
        );
        f.print(`  service: {`);
        f.print(`    methods: {`);
        f.print(`      ${localName(method)}: {`);
        f.print(`        name: ${literalString(method.name)},`);
        f.print(
          `        kind: `,
          rtMethodKind,
          `.${MethodKind[method.methodKind]},`,
        );
        f.print(`        I: `, method.input, `,`);
        f.print(`        O: `, method.output, `,`);
        f.print(`      },`);
        f.print(`    },`);
        f.print(`    typeName: ${literalString(service.typeName)},`);
        f.print(`  },`);
        f.print(`}).${localName(method)};`); // Note, the reason for dot accessing the method rather than destructuring at the top is that it allows for a TSDoc to be attached to the exported variable.  Also it's nice that each method has its own atomic section that you could independently inspect and debug (i.e. commenting a single method is much easier when it's one contiguous set of lines).

        const lastIndex = index === filteredMethods.length - 1;
        if (!lastIndex) {
          f.print();
        }
      });
  };

/**
 * This function generates the TypeScript output files
 */
export const generateTs: PluginInit['generateJs'] & PluginInit['generateTs'] = (
  schema,
  extension,
) => {
  schema.files.forEach((protoFile) => {
    protoFile.services.forEach(
      generateServiceFile(schema, protoFile, extension),
    );
  });
};
