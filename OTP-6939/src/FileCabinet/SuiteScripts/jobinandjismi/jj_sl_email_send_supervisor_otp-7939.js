/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/email', 'N/record', 'N/search', 'N/ui/serverWidget','N/file','N/encode'],
    /**
 * @param{email} email
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{file} file
 * @param{encode} encode
 */
    (email, record, search, serverWidget, file,encode) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        function EmployeeSearch(){
            try {
               let searchObj = search.create({
                   type: search.Type.EMPLOYEE,
                   filters:  ["isinactive","any","F"],
                   columns: ['entityid','internalid']
               })
               let results = searchObj.run().getRange({
                start: 0,
                end: 1000
            });
            //    log.debug("results",results)
                return results;
               
               
            } catch (e) {
               log.error("error",e.message)
            }
           }
           
        function createXlsxFile(arrayData,employeeId){
            

            // let csvContent = 'DocumentNo,Vendor,Memo,Amount\n';
            let XML='';
            XML += '<?xml version="1.0"?>';
            XML += '<?mso-application progid="Excel.Sheet"?>';
            XML += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"';
            XML += ' xmlns:o="urn:schemas-microsoft-com:office:office"';
            XML += ' xmlns:x="urn:schemas-microsoft-com:office:excel"';
            XML += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
            XML += '<Styles>';
            XML += '  <Style ss:ID="Default" ss:Name="Normal">';
            XML += '    <Alignment ss:Vertical="Bottom"/>';
            XML += '    <Font ss:FontName="Arial" ss:Size="11" ss:Color="#000000"/>';
            XML += '  </Style>';
            XML += '  <Style ss:ID="Header">';
            XML += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>';
            XML += '    <Font ss:Bold="1" ss:Color="#FFFFFF"/>';
            XML += '    <Interior ss:Color="#AAAAAA" ss:Pattern="Solid"/>';
            XML += '  </Style>';
            XML += '<Style ss:ID="s156">'; 
            XML += '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/> ';
            XML +='<Borders/>';
            XML +=' <Font ss:FontName="Times New Roman" x:Family="Roman" ss:Color="#000000"/> <Interior/> </Style>'
            XML += '</Styles>';

            XML += '<Worksheet ss:Name="Sheet1">';
            XML += '  <Table>';
            XML += '    <Row>';
            XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Document No</Data></Cell>';
            XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Vendor</Data></Cell>';
            XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Memo</Data></Cell>';
            XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Reason for Delay</Data></Cell>';
            XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Total</Data></Cell>';
            XML += '    </Row>';
            for(let i =0;i<arrayData.length;i++){
            XML += ' <Row>';
            XML += ' <Cell ss:StyleID="s156"><Data ss:Type="Number">' + arrayData[i].docno + '</Data></Cell>';
            XML += ' <Cell ss:StyleID="s156"><Data ss:Type="String">' + arrayData[i].vendor + '</Data></Cell>';
            XML += ' <Cell ss:StyleID="s156"><Data ss:Type="String">' + arrayData[i].memo + '</Data></Cell>';
            XML += ' <Cell ss:StyleID="s156"><Data ss:Type="String">' + arrayData[i].reason + '</Data></Cell>';
            XML += ' <Cell ss:StyleID="s156"><Data ss:Type="Number">' + arrayData[i].total + '</Data></Cell>';
            XML += ' </Row>';
            }
            XML += ' </Table>';
            XML += '</Worksheet>';
            XML += '</Workbook>';
            
             
            log.debug("xml",XML);
            let base64EncodedString = encode.convert({
                string: XML,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            let xlsFile = file.create({
                name: 'Pending Purchase Orders' + employeeId + '.xls',
                fileType: 'EXCEL',
                contents: base64EncodedString,
                folder: -15,
                isOnline:true
            });
            let xlsFileId = xlsFile.save();
            return xlsFileId;   
          
        }
        function getDataValues(request,lineCount){
            let dataDetails =[];
            for(let i=0;i<lineCount;i++){
                let select = request.getSublistValue({
                    group: "custpage_jj_porder",
                    line:i,
                    name: "custpage_jj_sub_porder_select"
                });
                log.debug("select",select);
                if(select ==='T'){
                dataDetails.push({
                    docno:request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name: "custpage_jj_sub_porder_docno"
                    }),
                    vendor: request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name:"custpage_jj_sub_porder_vendor"
                    }),
                    memo :request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name: "custpage_jj_sub_porder_memo"
                    }),
                    reason:request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name: "custpage_jj_sub_porder_rd"
                    }),
                    total:request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name: "custpage_jj_sub_porder_total"
                    })
                });
                } 
            }
            log.debug("array",dataDetails);
            return dataDetails;   
          
        }
        function sendEmailToSupervisor(supervisor,csvFileId,supervisorName){
            email.send({
                author:-5 ,
                body: "Dear SuperVisor ,Here are the orders that are pending this month",
                recipients:supervisor,
                subject:"Pending Billed Purchase Orders",
                attachments:[file.load({
                    id: csvFileId
                })]
            })
            
            let body = "Email Sent to "+supervisorName;
            return body;
        }
        const onRequest = (scriptContext) => {
        try{
               
            if(scriptContext.request.method === "GET"){
                let form = serverWidget.createForm({
                    title: "Email Report",
                });
                form.addFieldGroup({
                    id: "custpage_jj_filter",
                    label: "FIlter"
                })
                // form.addFieldGroup({
                //     id: "totals_jj_page_group",
                //     label: "Page Group"
                // })
                form.clientScriptFileId = 3249;
                let employee = form.addField({
                    id: "custpage_jj_employee",
                    label: "Select a Employee",
                    type: serverWidget.FieldType.SELECT,
                    container: "custpage_jj_filter"
                });
                let results = EmployeeSearch();
                employee.addSelectOption({
                    value: "",
                    text: "",
                });
                for(let i =0;i<results.length;i++){
                    employee.addSelectOption({
                        value: results[i].getValue({
                            name: "internalid"
                        }),
                        text:  results[i].getValue({
                            name: "entityid"
                        })
                    })
                }
              
                form.addButton({
                    id: "custpage_jj_get_values_button",
                    label: "Get Values",
                    functionName: 'setValues'
                });
                form.addSubmitButton({
                    label: "Send Email"
                })
                let subList = form.addSublist({
                    id: "custpage_jj_porder",
                    label: "Purchase Order",
                    type: serverWidget.SublistType.LIST
                });
                subList.addField({
                    id: "custpage_jj_sub_porder_docno",
                    label: "Document No",
                    type: serverWidget.FieldType.INTEGER,
                })
                subList.addField({
                    id: "custpage_jj_sub_porder_vendor",
                    label: "Vendor",
                    type: serverWidget.FieldType.TEXT,
                  
                })
                let memo = subList.addField({
                    id: "custpage_jj_sub_porder_memo",
                    label: "Memo",
                    type: serverWidget.FieldType.TEXT,
                  
                })
                let reason = subList.addField({
                    id: "custpage_jj_sub_porder_rd",
                    label: "Reason For Delay",
                    type: serverWidget.FieldType.TEXT,
                })
                subList.addField({
                    id: "custpage_jj_sub_porder_total",
                    label: "Total Amount",
                    type: serverWidget.FieldType.CURRENCY,
                })
                subList.addField({
                    id: "custpage_jj_sub_porder_select",
                    label: "Select",
                    type: serverWidget.FieldType.CHECKBOX,
                    
                })
               
                let employeeId = scriptContext.request.parameters.empId||null;
                
                employee.defaultValue = employeeId;
                // const pageSize  = 10;
                log.debug("empid",employeeId);
                if(employeeId){
                    let purchaseorderSearchObj = search.create({
                        type: "purchaseorder",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters:
                        [
                           ["type","anyof","PurchOrd"], 
                           "AND", 
                           ["mainline","is","T"], 
                           "AND", 
                           ["datecreated","within","thismonth"], 
                           "AND", 
                           ["status","anyof","PurchOrd:F"], 
                           "AND", 
                           ["createdby","anyof",employeeId]
                        ],
                        columns:
                        [
                           search.createColumn({name: "tranid", label: "Document Number"}),
                           search.createColumn({
                              name: "entityid",
                              join: "vendor",
                              label: "Name"
                           }),
                           search.createColumn({name: "memo", label: "Memo"}),
                           search.createColumn({name: "amount", label: "Amount"}),
                           search.createColumn({name: "datecreated", label: "Date Created"}),
                           search.createColumn({name: "createdby", label: "Created By"})
                        ]
                     });
                     let results = purchaseorderSearchObj.run().getRange({
                        start:0,
                        end:10
                     });
                    

                     log.debug("results",results);
                     for(let i =0;i<results.length;i++){
                        subList.setSublistValue({
                            id: "custpage_jj_sub_porder_docno",
                            line: i,
                            value: results[i].getValue({name: "tranid", label: "Document Number"})||''
                        });
                        subList.setSublistValue({
                            id: "custpage_jj_sub_porder_vendor",
                            line: i,
                            value: results[i].getValue({ name: "entityid",
                                join: "vendor",
                                label: "Name"})||''
                        });
                        subList.setSublistValue({
                            id: "custpage_jj_sub_porder_memo",
                            line: i,
                            value: results[i].getValue({ name: "memo", label: "Memo"})||''
                        });
                        memo.updateDisplayType({
                            displayType : serverWidget.FieldDisplayType.ENTRY
                        });
                        reason.updateDisplayType({
                            displayType : serverWidget.FieldDisplayType.ENTRY
                        });
                        subList.setSublistValue({
                            id: "custpage_jj_sub_porder_total",
                            line: i,
                            value: results[i].getValue({ name: "amount", label: "Amount"})||''
                        });
                     }
                     
                     /*Code Snippet to do Pagination 
                //      let pageIndex1  = parseInt(scriptContext.request.parameters.pageIndex) || 0;
                //      log.debug("pageindex",pageIndex1);
                //      let pagedData = purchaseorderSearchObj.runPaged({ pageSize: pageSize });
                //      log.debug("purchaseorderSearchObj result ",pagedData);
                //      let totalLines = pagedData.count;
                //      let totalPages = Math.ceil(totalLines / pageSize);
                //      if (totalLines === 0) {
                //         alert("No Results Found")
                //       } else {
                //         // Set page index from request parameters or default to 0 if out of range
                //         if (pageIndex1 < 0 || pageIndex1 >= totalPages) {
                //           pageIndex1 = 0;
                //         }
                //         let currentPage = pagedData.fetch({ index: pageIndex1 });
                //         let lineCount = 0; // Initialize line count
                //         currentPage.data.forEach(function (result) {
                //             subList.setSublistValue({
                //                 id: "custpage_jj_porder",
                //                 line: lineCount,
                //                 value: result.getValue({name: "tranid", label: "Document Number"})
                //               });
                //             lineCount++;
                //         })
                // }
                          let pageSelectField = form.addField({
                          id: ‘custpage_jj_page_index’,
                          type: serverWidget.FieldType.SELECT,
                          label: ‘Line Index’,
                          container: ‘totals_jj_page_group’
                    });
                     for (let i = 0; i < totalPages; i++) {
                     let startIndex = (i * pageSize) + 1;
                     let endIndex = Math.min((i + 1) * pageSize, totalLines);
                     pageSelectField.addSelectOption({
                     value: i.toString(),
                     text: startIndex + '-' + endIndex + ' of ' + totalLines,
                     isSelected: (i === pageIndex)
                    });
                    }
                */

             }
             scriptContext.response.writePage(form);     
    }else{
        let request = scriptContext.request;
        //let sublistid = "custpage_jj_sublist";
        let lineCount = request.getLineCount({
            group: "custpage_jj_porder"
        });
        let excelFile;
        let arrayData;
        let body;
        let employeeId = scriptContext.request.parameters.custpage_jj_employee;
        let lookupSearchObj  = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: employeeId,
            columns: ['supervisor']
            });
            let supervisor = lookupSearchObj.supervisor[0].value;
            let supervisorName = lookupSearchObj.supervisor[0].text;
            log.debug("supervisor",supervisor);
            log.debug("supervisor",supervisorName);
        if(lineCount>0){
            arrayData = getDataValues(request,lineCount);
            excelFile = createXlsxFile(arrayData,employeeId)
           
           body    = sendEmailToSupervisor(supervisor,excelFile,supervisorName)
        } 
        //let finalText = "CsvContent"+csvFile+"\n"+body;
        scriptContext.response.write(body);     
    }


        }catch(e){
         log.error("error",e.message);
        }

}


        return {onRequest}

    });
