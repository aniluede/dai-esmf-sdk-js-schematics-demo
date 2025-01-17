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

export function exportDialogTests(hasRemoteDataCall: boolean): void {
  describe('Export dialog functionalities', (): void => {
    it('should load export dialog', (): void => {
      cy.get('[data-test="export-data-button-card"]').should('exist');
    });

    it('should open export dialog', (): void => {
      cy.get('[data-test="export-data-button-card"]').click();
      cy.get('[data-test="dialogDescription"]').then(element => expect(element.text()).to.eq('Export entire datasource.'));
    });

    it('should change cases for exporting', (): void => {
      if (hasRemoteDataCall) {
        cy.get('[data-test="exportAllPages"]')
          .then(element => expect(element.text().trim()).to.eq('export the maximum of 5000 pages'))
          .then(() => cy.get('[data-test="exportAllPages"] > .mat-checkbox-layout > .mat-checkbox-inner-container').click())
          .then(() => cy.get('[data-test="dialogDescription"]'))
          .then(element => expect(element.text()).to.eq('Export the maximum of 5000 pages from all 4 columns.'))

          .then(() => cy.get('[data-test="closeDialog"]').click());
      } else {
        cy.get('[data-test="closeDialog"]').click();
      }
    });
  });
}
