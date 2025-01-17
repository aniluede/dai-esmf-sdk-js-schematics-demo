/*
 * Copyright (c) 2023 Robert Bosch Manufacturing Solutions GmbH
 *
 * See the AUTHORS file(s) distributed with this work for
 * additional information regarding authorship.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import {cardTests} from '../../reusable-card/card';
import {commandBarTests} from '../../reusable-card/command-bar';

describe.skip('Command bar with date filter', (): void => {
  before((): void => {
    cy.visit('/');
    cy.get('[data-test="command-bar-date-filter"]').click();
    cy.get('#mat-tab-label-0-1').first().click();
  });

  cardTests();

  commandBarTests();

  it('should show at least a date time picker', (): void => {
    cy.get('[data-test="form-field-date-time"]').its('length').should('be.at.least', 1);
  });
});
