/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url'],
    /**
     * @param{currentRecord} currentRecord
     * @param{url} url
     */
    function(currentRecord, url) {
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            window.onbeforeunload =null;
        }
        function redirectToSuiteletPage() {
            try {
                let currRecord = currentRecord.get();
                let employeeId = currRecord.getValue({
                    fieldId: "custpage_jj_employee"
                });
                let suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_jj_sl_suitelet_2_otp6939',
                    deploymentId: 'customdeploy_jj_sl_suitelet_2_otp6939'
                });
                window.location.href = suiteletUrl + '&employee=' + employeeId;
            }
            catch(e){
                log.debug('Error@redirectToSalesOrdersPage', e.stack + '\n' + e.message);
            }
        }
        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
      
        function fieldChanged(scriptContext) {

            console.log("triggering");
            let pageId = scriptContext.currentRecord.getValue({
                fieldId: "custpage_jj_pageid"
            });
            let employeeId = scriptContext.currentRecord.getValue({
                fieldId: "custpage_jj_employee"
            });
        if(scriptContext.fieldId == 'custpage_jj_pageid') {    

        document.location = url.resolveScript({
            deploymentId:  getParameterFromURL('deploy'),
            scriptId: getParameterFromURL('script'),
            params: {
                pageid :pageId,
                empId : employeeId
            }
        })
    
    
        }
    }
        function setValues(){
         try {
            
            let currRecord = currentRecord.get();
            let employeeId = currRecord.getValue({
                fieldId: "custpage_jj_employee"
            });
            console.log("employee",employeeId);
            document.location = url.resolveScript({
                deploymentId: "customdeploy_jj_sl_suitelet_2_otp6939",
                scriptId: "customscript_jj_sl_suitelet_2_otp6939",
                params: {
                    empId : employeeId
                }
            })

          
        
         } catch (e) {
            console.log("error",e.message+e.stack)
         }
    }
        // function returnPageId(){
         
        // }
        function getSuiteletPage(pageId) {
           
            document.location = url.resolveScript({
                    scriptId : "customdeploy_jj_sl_suitelet_2_otp6939",
                    deploymentId : "customscript_jj_sl_suitelet_2_otp6939",
                    params : {
                        pageid : pageId,
                    }
                });
        }
        function getParameterFromURL(param) {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == param) {
                    return decodeURIComponent(pair[1]);
                }
            }
            return (false);
        }
     
      
        return {
            pageInit: pageInit,
            setValues:setValues,
            fieldChanged:fieldChanged,
           getSuiteletPage: getSuiteletPage,
           redirectToSuiteletPage:redirectToSuiteletPage

        };
        
    });
 