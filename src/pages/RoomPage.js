import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/apiService';

// スタイル定義
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 95%;
`;

const Header = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const BackButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #0056b3;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
  
  .spinner {
    margin-right: 10px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AnnouncementContainer = styled.div`
  background: linear-gradient(to right, #eff6ff, #e0e7ff);
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #bfdbfe;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const AnnouncementTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  margin-top: 0;
`;

const CodeExample = styled.span`
  background-color: #ffffff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: #2563eb;
`;

const ExampleText = styled.span`
  color: #4b5563;
`;

const ChecklistItem = styled.p`
  display: flex;
  align-items: center;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Checkmark = styled.span`
  color: #10b981;
  margin-right: 0.5rem;
`;

const CodeBlock = styled.div`
  background-color: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
`;

const EditAnnouncement = styled.div`
  margin-top: 1.5rem;
  display: ${props => props.show ? 'block' : 'none'};
`;

const DataContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const DataItem = styled.div`
  margin-bottom: 15px;
  
  &.name-item {
    border: 1px solid lightgray;
    padding: 0.5rem;
    margin: 0 0 1.0rem 0;
  }
`;

const HeaderText = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
`;

const DataValue = styled.div`
  padding: 8px;
  background: #f8f9fa;
  border-radius: 3px;
  color: #333;
`;

const DataInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  
  &.modified {
    border-color: #ffc107;
    background-color: #fff3cd;
  }
  
  &.invalid {
    border-color: red;
  }
`;

const DataSelect = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  
  &.modified {
    border-color: #ffc107;
    background-color: #fff3cd;
  }
  
  &.invalid {
    border-color: red;
  }
`;

const RequiredMark = styled.span`
  color: red;
  margin-left: 4px;
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 12px;
  margin-top: 4px;
`;

const PreviewItem = styled.div`
  border: ${props => props.highlighted ? '2px solid #FFD700' : '1px solid #bfdbfe'};
  padding: ${props => props.highlighted ? '8px' : '0.5rem'};
  background: #f8f9ff;
  margin-bottom: 15px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  background: ${props => {
        if (props.variant === 'save') return '#28a745';
        if (props.variant === 'cancel') return '#6c757d';
        return '#007bff';
    }};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => {
        if (props.variant === 'save') return '#218838';
        if (props.variant === 'cancel') return '#5a6268';
        return '#0056b3';
    }};
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

// メインコンポーネント
const RoomPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State管理
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [roomData, setRoomData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [roomSchema, setRoomSchema] = useState(null);
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [propertyId, setPropertyId] = useState(null);
    const [propertyName, setPropertyName] = useState('');
    const [originalRoomName, setOriginalRoomName] = useState('');
    const [previewName, setPreviewName] = useState('');
    const [errors, setErrors] = useState({});
    const [modifiedFields, setModifiedFields] = useState(new Set());

    // データ取得
    const fetchRoomData = useCallback(async () => {
        try {
            setLoading(true);

            // スキーマとデータを並行取得
            const [schemaResponse, dataResponse] = await Promise.all([
                apiService.getRoomSchema(),
                apiService.getRoomData(id)
            ]);

            // スキーマの調整（GASコードから移植）
            if (schemaResponse.lead_room_type_id) {
                schemaResponse.lead_room_type_name = {
                    ...schemaResponse.lead_room_type_id,
                    japaneseName: "部屋タイプ名"
                };
                delete schemaResponse.lead_room_type_id;
            }

            setRoomSchema(schemaResponse);
            setRoomData(dataResponse[0]);
            setOriginalData(dataResponse[0]);
            setPropertyId(dataResponse[0]["lead_property_id"]);
            setPropertyName(dataResponse[0]["lead_property_name"]);
            setOriginalRoomName(dataResponse[0]["name"]);

            // プレビュー名を初期化
            const initialPreviewName = dataResponse[0]["lead_property_name"] + " " + (dataResponse[0]["room_number"] || "");
            setPreviewName(initialPreviewName);

        } catch (error) {
            console.error('Error fetching room data:', error);
            // エラーハンドリング
        } finally {
            setLoading(false);
        }
    }, [id]);

    // ドロップダウンオプション取得
    const fetchDropdownOptions = useCallback(async () => {
        try {
            const options = await apiService.getDropdownOptions(propertyId);
            setDropdownOptions(options);
        } catch (error) {
            console.error('Error fetching dropdown options:', error);
        }
    }, [propertyId]);

    // 初期化
    useEffect(() => {
        fetchRoomData();
    }, [fetchRoomData]);

    // フィールドタイプ取得
    const getFieldType = (fieldName) => {
        const fieldSchema = roomSchema?.[fieldName];
        return fieldSchema ? fieldSchema.type.toLowerCase() : "string";
    };

    // 入力タイプ取得
    const getInputType = (fieldType) => {
        switch (fieldType) {
            case "numeric":
                return "number";
            case "date":
                return "date";
            default:
                return "text";
        }
    };

    // バリデーション
    const validateInput = (fieldName, value, isRequired) => {
        let isValid = true;
        let errorMessage = "";

        // 特殊文字パターン
        const specialCharactersPattern = /[^\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}0-9a-zA-Z\s\-_\/()・，．.ー,.]/u;

        // 空値チェック
        if (value === null || value === "") {
            if (isRequired) {
                isValid = false;
                errorMessage = "この項目は必須です。";
            }
            return { isValid, errorMessage };
        }

        // 必須チェック
        if (isRequired && !value) {
            isValid = false;
            errorMessage = "この項目は必須です。";
        }

        // room_numberの特殊文字チェック
        if (fieldName === "room_number" && specialCharactersPattern.test(value)) {
            isValid = false;
            errorMessage = "使用できない文字が含まれています。";
        }

        // フィールドタイプ別バリデーション
        const fieldType = getFieldType(fieldName);
        switch (fieldType) {
            case "numeric":
                if (isNaN(value)) {
                    isValid = false;
                    errorMessage = "数値を入力してください。";
                }
                break;
            case "date":
                if (isNaN(Date.parse(value))) {
                    isValid = false;
                    errorMessage = "正しい日付形式で入力してください。";
                }
                break;
        }

        return { isValid, errorMessage };
    };

    // 全入力値バリデーション
    const validateAllInputs = () => {
        const newErrors = {};
        let isValid = true;

        Object.keys(roomData).forEach(fieldName => {
            if (roomSchema[fieldName]?.editable) {
                const isRequired = roomSchema[fieldName]?.isRequired;
                const value = roomData[fieldName];
                const validation = validateInput(fieldName, value, isRequired);

                if (!validation.isValid) {
                    newErrors[fieldName] = validation.errorMessage;
                    isValid = false;
                }
            }
        });

        // lead_room_type_nameの特別バリデーション
        const statusValue = roomData.status;
        const requiredStatusValues = ["A", "B", "C", "D", "E", "クローズ"];

        if (requiredStatusValues.includes(statusValue)) {
            const leadRoomTypeValue = roomData.lead_room_type_name;
            if (!leadRoomTypeValue) {
                newErrors.lead_room_type_name = "ステータスがE以上の場合、この項目は必須です";
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    // 入力変更ハンドラ
    const handleInputChange = (fieldName, value) => {
        setRoomData(prev => ({ ...prev, [fieldName]: value }));

        // 変更フィールドの追跡
        const newModifiedFields = new Set(modifiedFields);
        if (value !== originalData[fieldName]) {
            newModifiedFields.add(fieldName);
        } else {
            newModifiedFields.delete(fieldName);
        }
        setModifiedFields(newModifiedFields);

        // room_numberが変更された場合、プレビューを更新
        if (fieldName === "room_number") {
            const newPreviewName = propertyName + " " + (value || "");
            setPreviewName(newPreviewName);
        }

        // エラーをクリア
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    // 編集モード開始
    const handleEdit = async () => {
        await fetchDropdownOptions();
        setIsEditMode(true);
    };

    // 保存処理
    const handleSave = async () => {
        // プレビュー名の変更チェック
        const hasPreviewNameChanged = previewName !== originalRoomName;
        const hasOtherChanges = modifiedFields.size > 0 &&
            (modifiedFields.size > 1 || !modifiedFields.has("room_number"));

        // 変更がない場合は編集モードを終了
        if (!hasPreviewNameChanged && !hasOtherChanges) {
            setIsEditMode(false);
            return;
        }

        if (!validateAllInputs()) {
            alert("無効な入力があります。入力内容を確認してください。");
            return;
        }

        try {
            // 更新データの構築
            const updatedData = {};
            modifiedFields.forEach(fieldName => {
                updatedData[fieldName] = roomData[fieldName];
            });

            // プレビュー名が変更されている場合
            if (hasPreviewNameChanged) {
                updatedData["name"] = previewName;
            }

            // 重複チェック（プレビュー名が変更されている場合のみ）
            if (hasPreviewNameChanged) {
                const duplicationResponse = await apiService.checkDuplication("room", previewName);
                const [isUnique, duplicationNameList] = duplicationResponse;

                if (!isUnique) {
                    const warningMessage = `下記の部屋名は既に使われています。\n\n${duplicationNameList.join('\n')}`;
                    alert(warningMessage);
                    return;
                }
            }

            // データ更新
            await apiService.updateRoomData(id, updatedData);

            // データ再取得
            await fetchRoomData();
            setIsEditMode(false);
            setModifiedFields(new Set());

        } catch (error) {
            console.error('Error saving room data:', error);
            alert("保存に失敗しました。");
        }
    };

    // キャンセル処理
    const handleCancel = () => {
        const hasChanges = modifiedFields.size > 0 || previewName !== originalRoomName;

        if (hasChanges) {
            if (window.confirm("変更されたデータがあります。キャンセルしますか？")) {
                setRoomData(originalData);
                setPreviewName(propertyName + " " + (originalData["room_number"] || ""));
                setModifiedFields(new Set());
                setErrors({});
                setIsEditMode(false);
            }
        } else {
            setIsEditMode(false);
        }
    };

    // 戻るボタン処理
    const handleBack = () => {
        navigate(`/property/${propertyId}`);
    };

    // データフィールドレンダリング
    const renderDataField = (fieldName, fieldConfig) => {
        const value = roomData[fieldName];
        const isEditable = fieldConfig.editable;
        const isRequired = fieldConfig.isRequired;
        const fieldType = getFieldType(fieldName);
        const isModified = modifiedFields.has(fieldName);
        const error = errors[fieldName];

        let headerText = fieldConfig.japaneseName || fieldName;
        if (isRequired) {
            headerText += " (必須)";
        }

        if (!isEditMode || !isEditable) {
            return (
                <DataItem key={fieldName}>
                    <HeaderText>{headerText}</HeaderText>
                    <DataValue>{value === 0 ? "0" : value || ""}</DataValue>
                </DataItem>
            );
        }

        // 編集モード
        const options = dropdownOptions[fieldName] || [];

        if (options.length > 0 || fieldName === "lead_room_type_name") {
            // セレクトボックス
            return (
                <DataItem key={fieldName}>
                    <HeaderText>{headerText}</HeaderText>
                    <DataSelect
                        value={value || ""}
                        onChange={(e) => handleInputChange(fieldName, e.target.value)}
                        className={`${isModified ? 'modified' : ''} ${error ? 'invalid' : ''}`}
                    >
                        <option value="">{value ? value : ""}</option>
                        <option value="">（選択なし）</option>
                        {fieldName === "lead_room_type_name" && dropdownOptions.lead_room_type_name ?
                            dropdownOptions.lead_room_type_name
                                .filter(option => {
                                    const [id, name] = option.split("|");
                                    return name !== value && name !== "0";
                                })
                                .map(option => {
                                    const [id, name] = option.split("|");
                                    return <option key={id} value={id}>{name}</option>;
                                })
                            :
                            options
                                .filter(option => option !== value && option !== 0)
                                .map(option =>
                                    <option key={option} value={option}>{option}</option>
                                )
                        }
                    </DataSelect>
                    {isRequired && <RequiredMark>*</RequiredMark>}
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                </DataItem>
            );
        } else {
            // 入力フィールド
            return (
                <DataItem key={fieldName}>
                    <HeaderText>{headerText}</HeaderText>
                    <DataInput
                        type={getInputType(fieldType)}
                        value={value || ""}
                        onChange={(e) => handleInputChange(fieldName, e.target.value)}
                        className={`${isModified ? 'modified' : ''} ${error ? 'invalid' : ''}`}
                    />
                    {isRequired && <RequiredMark>*</RequiredMark>}
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                </DataItem>
            );
        }
    };

    if (loading) {
        return (
            <Container>
                <LoadingContainer>
                    <div className="spinner">⟳</div>
                    データを読み込んでいます...
                </LoadingContainer>
            </Container>
        );
    }

    if (!roomData || !roomSchema) {
        return (
            <Container>
                <div>データが見つかりません。</div>
            </Container>
        );
    }

    // ソート済みヘッダー
    const sortedHeaders = Object.keys(roomSchema).sort((a, b) => {
        return roomSchema[a].order - roomSchema[b].order;
    });

    const isPreviewHighlighted = originalRoomName !== previewName;

    return (
        <Container>
            <BackButton onClick={handleBack}>
                ← 戻る
            </BackButton>

            <Header>部屋詳細</Header>

            <AnnouncementContainer>
                <AnnouncementTitle>- 新しい命名規則のお知らせ</AnnouncementTitle>
                <div>
                    <p>
                        部屋名の新しい形式：
                        <CodeExample>&lt;建物名&gt; &lt;部屋番号&gt;</CodeExample>
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                        例：<ExampleText>"本館 101"、"A棟 201"</ExampleText>
                    </p>
                </div>

                <EditAnnouncement show={isEditMode}>
                    <AnnouncementTitle>- 部屋名の自動生成について</AnnouncementTitle>
                    <div style={{ marginTop: '0.5rem' }}>
                        <ChecklistItem>
                            <Checkmark>✓</Checkmark>
                            <CodeExample>部屋 番号</CodeExample>のみ入力してください
                        </ChecklistItem>
                        <ChecklistItem>
                            <Checkmark>✓</Checkmark>
                            建物名と部屋番号から部屋名が自動生成されます
                        </ChecklistItem>
                        <CodeBlock>
                            例：建物名 "本館" + 部屋番号 "101" → 部屋名 "本館 101" が自動生成
                        </CodeBlock>
                    </div>
                </EditAnnouncement>
            </AnnouncementContainer>

            <DataContainer>
                {sortedHeaders.map(fieldName => {
                    // 名前フィールドの特別処理
                    if (fieldName === "name") {
                        if (isEditMode) {
                            return (
                                <div key={fieldName}>
                                    <DataItem className="name-item">
                                        {renderDataField(fieldName, roomSchema[fieldName])}
                                    </DataItem>
                                    <PreviewItem highlighted={isPreviewHighlighted}>
                                        <HeaderText>部屋名 （更新プレビュー）</HeaderText>
                                        <DataValue>{previewName}</DataValue>
                                    </PreviewItem>
                                </div>
                            );
                        } else {
                            return renderDataField(fieldName, roomSchema[fieldName]);
                        }
                    }

                    return renderDataField(fieldName, roomSchema[fieldName]);
                })}

                <ButtonContainer>
                    {!isEditMode ? (
                        <Button onClick={handleEdit}>
                            ✏️ 編集
                        </Button>
                    ) : (
                        <>
                            <Button variant="save" onClick={handleSave}>
                                💾 保存
                            </Button>
                            <Button variant="cancel" onClick={handleCancel}>
                                ❌ キャンセル
                            </Button>
                        </>
                    )}
                </ButtonContainer>
            </DataContainer>
        </Container>
    );
};

export default RoomPage;
